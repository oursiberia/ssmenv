import * as AWS from 'aws-sdk';
import * as LRU from 'lru-cache';
import { Tag } from './tag';

/** Type alias for a function converting a string to another, parameterized type. */
export type Convert<T> = (value: string) => T;
/** Type alias for a parameterized type that may be undefined. */
export type Option<T> = T | undefined;
/** Type alias for `AWS.SSM.GetParametersByPathResult`. */
export type Options = Partial<AWS.SSM.GetParametersByPathRequest>;
/** Type alias for `AWS.SSM.Paramter`. */
export type Parameter = AWS.SSM.Parameter;
/** Type alias for `AWS.SSM.PutParameterRequest`. */
export type PutRequest = AWS.SSM.PutParameterRequest;
/** Type alias for `AWS.SSM.PutParameterResult`. */
export type PutResult = AWS.SSM.PutParameterResult;

/**
 * Structure of an environment variable.
 */
export interface EnvironmentVariable {
  /** Full path of the parameter. */
  path: string;
  /** Path of the parameter without environemnt path. */
  key: string;
  /** Tags applied to the parameter. */
  tags?: Tag[];
  /** Value of the parameter. */
  value?: string;
  /** Version of the parameter. */
  version?: number;
}

/**
 *
 */
export class Config {
  /** Whether or not the initial load from AWS was successfully completed. */
  isReady: Promise<boolean>;
  /** The LRU cache used for expiring values. */
  private cache: LRU.Cache<string, EnvironmentVariable>;
  /** The prefix for AWS.SSM.Parameter values, the path to search recursively. */
  private environment: string;
  /** RegExp to find key value at the end of the path (extracting `environment`). */
  private keyMatcher: RegExp;
  /** Options to include when requesting parameters. */
  private options: Options;
  /** The `AWS.SSM` instance used to retrieve data. */
  private ssm: AWS.SSM;

  /**
   * Create a `Config` instance for the given `environment` using `ssm` to
   * retrieve parameter valeus.
   * @param {string} environment path to search.
   * @param {AWS.SSM} ssm to use for retrieving parameters.
   * @param {Options} options for requesting parameters.
   */
  constructor(environment: string, ssm: AWS.SSM, options: Options = {}) {
    this.cache = LRU({ max: 100, maxAge: 1000 * 60 * 60 * 24 });
    this.environment = `${environment}`;
    this.keyMatcher = new RegExp(`^${environment}/(.*)$`);
    this.options = options;
    this.ssm = ssm;
    this.isReady = this.refresh()
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Retrieve a configuration parameter with `key` from the parameter store. The
   * `convert` function transforms the resulting string value into any other type.
   * @param {string} key to search for.
   * @param {function} convert to change `string` value into another type.
   * @param {Type} T the resulting type from `convert`.
   * @returns {undefined | T} `undefined` if a value for `key` can not be found,
   *    the result of `convert` on the found value otherwise.
   */
  async getParamAs<T>(key: string, convert: Convert<T>): Promise<Option<T>> {
    const value = await this.getParam(key);
    if (value === undefined) {
      return undefined;
    } else {
      return convert(value);
    }
  }

  /**
   * Retrieve a configuration parameter with `key` from the parameter store.
   * @param {string} key to search for.
   * @returns {undefined | string} `undefined` if a value for `key` can not be
   *    found, the found `string` value otherwise.
   */
  async getParam(key: string): Promise<Option<string>> {
    const isReady = await this.isReady;
    const cacheKeys = this.cache.keys();
    const isCached = cacheKeys.findIndex(cacheKey => cacheKey === key) !== -1;
    const isStale = isCached && !this.cache.has(key);
    if (!isReady) {
      return undefined;
    } else if (isStale) {
      return this.refresh().then(() => {
        return this.getParam(key);
      });
    } else {
      const environmentVariable = this.cache.get(key);
      return environmentVariable === undefined
        ? undefined
        : environmentVariable.value;
    }
  }

  /**
   * Push a parameter with value up to the SSM Parameter Store.
   * @param key of the parameter to be combined with `environment`.
   * @param value to set.
   * @param description (optional) description to set on the parameter.
   * @returns The `EnvironmentVariable` representation of the parameter.
   */
  async put(key: string, value: string, description?: string) {
    const request: PutRequest = {
      Description: description,
      Name: `${this.environment}/${key}`,
      Overwrite: true,
      Type: 'String',
      Value: value,
    };
    return new Promise<EnvironmentVariable>((resolve, reject) => {
      this.ssm.putParameter(request, (err: AWS.AWSError, result: PutResult) => {
        if (err) {
          reject(err);
        } else if (result.Version === undefined) {
          reject(new Error(`No version provided when setting ${request.Name}`));
        } else {
          const environmentVariable: EnvironmentVariable = {
            key,
            path: request.Name,
            value,
            version: result.Version,
          };
          this.cache.set(key, environmentVariable);
          resolve(environmentVariable);
        }
      });
    });
  }

  get variables() {
    return this.cache.values();
  }

  /**
   * Asynchronously fetches all the parameter values, recursively traversing the
   * parameter tree for the given environment.
   * @returns {Promise<Parameter[]>} the array of `AWS.SSM.Parameter` values
   *    found when using the environment as a path.
   */
  private fetch(): Promise<Parameter[]> {
    const options: AWS.SSM.GetParametersByPathRequest = {
      ...this.options,
      Path: `${this.environment}`,
      Recursive: true,
    };
    return new Promise((resolve, reject) => {
      this.ssm.getParametersByPath(
        options,
        (err: AWS.AWSError, data: AWS.SSM.GetParametersByPathResult) => {
          if (err) {
            reject(err);
          } else {
            resolve(data.Parameters || []);
          }
        }
      );
    });
  }

  /**
   * Check that the given `param` has a `Name` defined and a valid `Type`.
   * @param {AWS.SSM.Parameter} param to test
   * @returns `true` if `Name` exists and `Type` is a convertable type, `false`
   *    otherwise.
   */
  private hasNameAndType(param: Parameter) {
    const hasName = param.Name !== undefined;
    const isString = param.Type === 'String';
    const isSecure = param.Type === 'SecureString';
    const withDecryption = this.options.WithDecryption;
    return hasName && (isString || (withDecryption && isSecure));
  }

  /**
   * Refresh the values in the configuration cache.
   */
  private async refresh(): Promise<void> {
    const parameters = await this.fetch();
    const variables: EnvironmentVariable[] = parameters
      .filter(this.hasNameAndType.bind(this))
      .map(this.toEnvironmentVariable.bind(this))
      .filter(variable => variable !== undefined) as EnvironmentVariable[];
    variables.forEach(variable => this.cache.set(variable.key, variable));
  }

  /**
   * Convert the given `param` to an object conforming to the `EnvironmentVariable`
   * interface.
   * @param {AWS.SSM.Parameter} param to be converted.
   * @return {EnvironmentVariable | undefined} `undefined` if the given `param`
   *    can not be converted; the `EnvironmentVariable` otherwise.
   */
  private toEnvironmentVariable(param: Parameter): Option<EnvironmentVariable> {
    const path = param.Name || '';
    const data = path.match(this.keyMatcher);
    const key = (data && data[1]) || undefined;
    if (key === undefined) {
      return undefined;
    } else {
      return {
        key,
        path,
        value: param.Value,
      };
    }
  }
}
