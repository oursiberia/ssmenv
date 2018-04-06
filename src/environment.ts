import * as AWS from 'aws-sdk';
import * as LRU from 'lru-cache';
import { Tag } from './tag';

/** Regex for a valid path part, meant to be reused as `source`. */
const PART = /[\w_-]+/;
/** Matches potential key values. */
const keyRegex = new RegExp(`^${PART.source}$`);
/**
 * Should match strings like `/Dev/DBServer/MySQL/db_string-13` with multiple
 * intermediate parts. There should not be a trailing `/` and it may not be
 * empty.
 */
const fqnRegex = new RegExp(`^/(${PART.source})(/${PART.source})*?$`);
/**
 * Should match strings like `/Dev/DBServer/MySQL/` with multiple intermediate
 * parts. There must be leading and trailing `/` but they may not be adjacent to
 * one another.
 */
const rootPathRegex = new RegExp(`^/((${PART.source})(/${PART.source})*?/)?$`);

/** Type alias for a function converting a string to another, parameterized type. */
export type Convert<T> = (value: string) => T;
/** string alias for fully qualified parameter name. */
export type FQN = string;
/** string alias for parameter name (not fully qualified). */
export type Key = string;
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
  path: FQN;
  /** Path of the parameter without environemnt path. */
  key: Key;
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
export class Environment {
  /**
   * Checks if the given `key` is a valid parameter name.
   * @param name to use in error messages identifying the invalid thing.
   * @param key to check for validity.
   * @throws `Error` if `key` is not valid.
   */
  static validatePathPart(name: string, key?: string): void {
    if (key === undefined) {
      throw new Error(`${name} may not be undefined.`);
    } else if (!keyRegex.test(key)) {
      throw new Error(
        `${name} is not valid, ${key} doesn't match ${keyRegex}.`
      );
    }
  }

  /**
   * Checks if the given `input` is permissible as a root path. Root paths
   * must start and end with `/` and have valid 'keys' between any two `/` which
   * follow one another.
   * @param input to be validated.
   * @return `true` if `input` is valid, a `string` message if `input` is not
   *    valid.
   */
  static validateRootPath(input: string): void {
    if (input === '/') {
      return;
    }
    if (!input.startsWith('/')) {
      throw new Error(`Root path must start with '/'; ${input} given.`);
    }
    if (!input.endsWith('/')) {
      throw new Error(`Root path must end with '/'; ${input} given.`);
    }
    if (input === '//') {
      throw new Error('Path can not have empty intermediate keys.');
    }
    const keys = input.slice(1, -1).split('/');
    if (keys.length === 1 && keys[0] === '') {
      return;
    } else {
      const results = keys.forEach(key => {
        Environment.validatePathPart('Path part', key);
      });
    }
  }

  /** Whether or not the initial load from AWS was successfully completed. */
  isReady: Promise<boolean>;
  /** The LRU cache used for expiring values. */
  private cache: LRU.Cache<FQN, Parameter>;
  /** The prefix for AWS.SSM.Parameter values, the path to search recursively. */
  private fqnPrefix: string;
  /** RegExp to find key value at the end of the path (extracting `rootPath`). */
  private keyMatcher: RegExp;
  /** Options to include when requesting parameters. */
  private options: Options;
  /** The `AWS.SSM` instance used to retrieve data. */
  private ssm: AWS.SSM;

  /**
   * Create a `Environment` instance for the given `rootPath` using `ssm` to
   * retrieve parameter valeus.
   * @param {string} fqnPrefix path to search.
   * @param {AWS.SSM} ssm to use for retrieving parameters.
   * @param {Options} options for requesting parameters.
   */
  constructor(fqnPrefix: string, ssm: AWS.SSM, options: Options = {}) {
    this.validateFqn(fqnPrefix);
    this.cache = LRU({ maxAge: 1000 * 60 * 60 * 24 });
    this.fqnPrefix = fqnPrefix;
    this.keyMatcher = new RegExp(`^${fqnPrefix}/(.*)$`);
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
  async getAs<T>(key: Key, convert: Convert<T>): Promise<Option<T>> {
    const value = await this.get(key);
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
  async get(key: Key): Promise<Option<string>> {
    const isReady = await this.isReady;
    const cacheKeys = this.cache.keys();
    const isCached = cacheKeys.findIndex(cacheKey => cacheKey === key) !== -1;
    const isStale = isCached && !this.cache.has(key);
    if (!isReady) {
      return undefined;
    } else if (isStale) {
      return this.refresh().then(() => {
        return this.get(key);
      });
    } else {
      const fqn = this.fqn(key);
      const parameter = this.cache.get(fqn);
      return parameter === undefined ? undefined : parameter.Value;
    }
  }

  /**
   * Push a parameter with value up to the SSM Parameter Store.
   * @param key of the parameter to be combined with `fqnPrefix`.
   * @param value to set.
   * @param description (optional) description to set on the parameter.
   * @returns The `EnvironmentVariable` representation of the parameter.
   */
  async put(key: Key, value: string, description?: string) {
    const fqn = this.fqn(key);
    const request: PutRequest = {
      Description: description,
      Name: fqn,
      Overwrite: true,
      Type: 'String',
      Value: value,
    };
    return new Promise<EnvironmentVariable>((resolve, reject) => {
      this.ssm.putParameter(request, (err: AWS.AWSError, result: PutResult) => {
        if (err) {
          reject(err);
        } else if (result.Version === undefined) {
          reject(new Error(`No version returned when setting ${fqn}`));
        } else {
          const parameter: Parameter = {
            Name: fqn,
            Type: request.Type,
            Value: request.Value,
            Version: result.Version,
          };
          this.cache.set(fqn, parameter);
          resolve(this.toEnvironmentVariable(parameter));
        }
      });
    });
  }

  /**
   * Get all the `EnvironmentVariable` instances we know about.
   * @returns all stored `EnvironmentVariable` instances.
   */
  get variables(): EnvironmentVariable[] {
    return this.cache.values().map(this.toEnvironmentVariable.bind(this));
  }

  /**
   * Asynchronously fetches all the parameter values, recursively traversing the
   * parameter tree for the given fqnPrefix.
   * @returns {Promise<Parameter[]>} the array of `AWS.SSM.Parameter` values
   *    found when using the `fqnPrefix` as a path.
   */
  private fetch(): Promise<Parameter[]> {
    const options: AWS.SSM.GetParametersByPathRequest = {
      ...this.options,
      Path: `${this.fqnPrefix}`,
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
   * The fully qualified name of the parameter based on the config `fqnPrefix`
   * and the `key` provided. The fully qualified name includes the complete
   * hierarchy of the parameter path and name (`key`). For example:
   * `/Dev/DBServer/MySQL/db-string13` where `/Dev/DBServer/MySQL` is the
   * `fqnPrefix` and `db-string13` is the `key`.
   *
   * For information about parameter name requirements and restrictions, see About
   * Creating Systems Manager Parameters in the AWS Systems Manager User Guide.
   * The maximum length constraint listed below includes capacity for additional
   * system attributes that are not part of the name. The maximum length for the
   * fully qualified parameter name is 1011 characters.
   * @param key to map to a fully qualified parameter name.
   * @returns the fully qualified parameter name.
   * @throws `Error` if `key` or fully qualified name are not valid.
   */
  private fqn(key: Key): FQN {
    const fqn = `${this.fqnPrefix}/${key}`;
    this.validateKey(key);
    this.validateFqn(fqn);
    return fqn;
  }

  /**
   * Check that the given `param` has a `Name` defined and a valid `Type`.
   * @param {AWS.SSM.Parameter} param to test
   * @returns `true` if `Name` exists and `Type` is a convertable type, `false`
   *    otherwise.
   */
  private hasNameAndType(param: Parameter): boolean {
    const hasName = param.Name !== undefined;
    const isString = param.Type === 'String';
    const isSecure = param.Type === 'SecureString';
    const withDecryption = this.options.WithDecryption || false;
    return hasName && (isString || (withDecryption && isSecure));
  }

  /**
   * Refresh the values in the configuration cache.
   */
  private async refresh(): Promise<void> {
    const parameters = await this.fetch();
    parameters
      .filter(this.hasNameAndType.bind(this))
      .forEach((param: Parameter) => this.cache.set(param.Name!, param));
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
        version: param.Version,
      };
    }
  }

  /**
   * Checks if the given `fqn` is a valid fully qualified parameter name.
   * @param fqn to check for validity.
   * @throws `Error` if `fqn` is not valid.
   */
  private validateFqn(fqn: FQN): void {
    if (fqn.length > 1011) {
      throw new Error(`FQN is too long, ${fqn.length} chars; max is 1011.`);
    }
    if (!fqnRegex.test(fqn)) {
      throw new Error(`FQN is not valid, ${fqn} doesn't match ${fqnRegex}.`);
    }
    const lastSlash = fqn.lastIndexOf('/') + 1; // offset by one to make slices easier
    Environment.validateRootPath(fqn.slice(0, lastSlash));
    this.validateKey(fqn.slice(lastSlash));
  }

  /**
   * Checks if the given `key` is a valid parameter name.
   * @param key to check for validity.
   * @throws `Error` if `key` is not valid.
   */
  private validateKey(key?: Key): void {
    Environment.validatePathPart('Key', key);
  }
}
