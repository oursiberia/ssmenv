import { SSM } from 'aws-sdk';
import * as LRU from 'lru-cache';

import { AwsSsmProxy } from './AwsSsmProxy';
import { Configuration as SSMConfiguration } from './AwsSsmTypes';
import { EnvironmentOptions } from './EnvironmentOptions';
import { EnvironmentVariable } from './EnvironmentVariable';
import { Tag } from './Tag';
import { Convert, FQN, Key, Option, Parameter } from './Types';

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
 *
 */
export class Environment {
  /**
   * List the all known stages or environments, ignoring any concept of a
   * configured `rootPath`. A stage or environment is considered any path with a
   * direct child path holding a value.
   * @param ssm to use for accessing API.
   * @returns a list of strings representing all the parameter store paths with
   *    at least one child parameter.
   */
  static async listAll(ssm: SSM | SSMConfiguration) {
    const instance = new AwsSsmProxy(ssm);
    const request = {
      Path: '/',
      Recursive: true,
    };
    const results = await instance.getParametersByPath(request);
    const parameters = results.Parameters || [];
    return parameters
      .map(param => {
        const lastSlash = param.Name!.lastIndexOf('/');
        return param.Name!.slice(0, lastSlash);
      })
      .reduce((paths: string[], next: string) => {
        if (paths.includes(next)) {
          return paths;
        } else {
          return [...paths, next];
        }
      }, [])
      .sort();
  }

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
      return; // Should be handled by input === '/'
    } else {
      keys.forEach(key => {
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
  /** EnvironmentOptions to include when requesting parameters. */
  private options: EnvironmentOptions;
  /** The `AWS.SSM` instance used to retrieve data. */
  private ssm: AwsSsmProxy;

  /**
   * Create a `Environment` instance for the given `rootPath` using `ssm` to
   * retrieve parameter valeus.
   * @param fqnPrefix path to search.
   * @param ssm to use for retrieving parameters.
   * @param options for requesting parameters.
   */
  constructor(
    fqnPrefix: string,
    ssm: SSM | SSMConfiguration,
    options: EnvironmentOptions = {}
  ) {
    this.validateFqn(fqnPrefix);
    this.cache = LRU({ maxAge: 1000 * 60 * 60 * 24 });
    this.fqnPrefix = fqnPrefix;
    this.keyMatcher = new RegExp(`^${fqnPrefix}/(${PART.source})$`);
    this.options = options;
    this.ssm = new AwsSsmProxy(ssm);
    this.isReady = this.refresh()
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Delete a configuration parameter from the parameter store.
   * @param key to delete.
   * @returns `true` if the parameter for `key` was successfully deleted,
   *    `false` if `key` was valid but not deleted.
   * @throws if `key` maps to an invalid parameter.
   */
  async del(key: Key): Promise<boolean> {
    const fqn = this.fqn(key);
    const result = await this.ssm.deleteParameters({
      Names: [fqn],
    });
    const invalidParameters = result.InvalidParameters || [];
    const deletedParameters = result.DeletedParameters || [];
    if (invalidParameters && invalidParameters.includes(fqn)) {
      throw new Error(`Unable to delete ${key}.`);
    } else if (deletedParameters && deletedParameters.includes(fqn)) {
      this.cache.del(fqn);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Retrieve a configuration parameter with `key` from the parameter store. The
   * `convert` function transforms the resulting string value into any other type.
   * @param key to search for.
   * @param convert to change `string` value into another type.
   * @param T the resulting type from `convert`.
   * @returns `undefined` if a value for `key` can not be found, the result of
   *    `convert` on the found value otherwise.
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
   * @param key to search for.
   * @returns `undefined` if a value for `key` can not be found, the found
   *    `EnvironmentVariable` value otherwise.
   */
  async get(key: Key): Promise<Option<EnvironmentVariable>> {
    const isReady = await this.isReady;
    const isStale = await this.isStale(key);
    if (!isReady) {
      return undefined;
    } else if (isStale) {
      return this.refresh().then(() => {
        return this.get(key);
      });
    } else {
      const fqn = this.fqn(key);
      const parameter = this.cache.get(fqn);
      return parameter === undefined
        ? undefined
        : this.toEnvironmentVariable(parameter);
    }
  }

  /**
   * Check if the environment has a value for the given key.
   * @param key to search for.
   * @returns `true` if `key` exists for this envrionment, `false` otherwise.
   */
  async has(key: Key): Promise<boolean> {
    const isReady = await this.isReady;
    if (!isReady) {
      throw new Error('Environment was not ready.');
    }
    return this.isCached(key);
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
    const request: SSM.PutParameterRequest = {
      Description: description,
      Name: fqn,
      Overwrite: true,
      Type: 'String',
      Value: value,
    };
    const result = await this.ssm.putParameter(request);
    const parameter: Parameter = {
      Description: description,
      Name: fqn,
      Type: request.Type,
      Value: request.Value,
      Version: result.Version,
    };
    this.cache.set(fqn, parameter);
    return this.toEnvironmentVariable(parameter)!;
  }

  /**
   * Apply `tags` to the variable identified by `key`.
   * @param key of the parameter to be combined with `fqnPrefix`.
   * @param tags to add or overwrite.
   * @returns The `EnvironmentVariable` that was modified including the `tags`.
   */
  async tag(key: Key, tags: Tag[] = []): Promise<EnvironmentVariable> {
    const fqn = this.fqn(key);
    const request: SSM.AddTagsToResourceRequest = {
      ResourceId: fqn,
      ResourceType: 'Parameter',
      Tags: tags,
    };
    const variable = await this.get(key);
    if (variable === undefined) {
      throw new Error(`${fqn} is not a known parameter.`);
    }
    const result = await this.ssm.addTagsToResource(request);
    // Put tags on variable
    return {
      ...variable,
      tags: result === undefined ? [] : tags,
    };
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
   * @returns the array of `SSM.Parameter` values found when using the
   *    `fqnPrefix` as a path.
   */
  private async fetch(): Promise<Parameter[]> {
    const options: SSM.GetParametersByPathRequest = {
      Path: `${this.fqnPrefix}`,
      Recursive: true,
      WithDecryption: this.options.withDecryption,
    };
    const result = await this.ssm.getParametersByPath(options);
    return result.Parameters || [];
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
   * @param param to test
   * @returns `true` if `Name` exists and `Type` is a convertable type, `false`
   *    otherwise.
   */
  private hasNameAndType(param: Parameter): boolean {
    const hasName = param.Name !== undefined;
    const isString = param.Type === 'String';
    const isSecure = param.Type === 'SecureString';
    const withDecryption = this.options.withDecryption || false;
    return hasName && (isString || (withDecryption && isSecure));
  }

  /**
   * Check that the given `key` is known to the cache.
   * @param key for which to check.
   * @returns `true` if the key is known to the cache, `false` otherwise.
   */
  private async isCached(key: Key): Promise<boolean> {
    const isReady = await this.isReady;
    const fqn = this.fqn(key);
    const cacheKeys = this.cache.keys();
    return isReady && cacheKeys.findIndex(cacheKey => cacheKey === fqn) !== -1;
  }

  /**
   * Check that the given `key` is known to the cache but has a stale value.
   * @param key to check.
   * @returns `true` if the key is known to the cache and the cached value has
   *    expired; `false` otherwise.
   */
  private async isStale(key: Key): Promise<boolean> {
    const isCached = await this.isCached(key);
    const fqn = this.fqn(key);
    // returns false if `key` isn't cached or if `key` never existed
    const isNotStaleOrCached = await this.cache.has(fqn);
    // given that key exists (`isCached`) then `isStaleOrNotCached` only means `isStale`
    return isCached && !isNotStaleOrCached;
  }

  /**
   * Refresh the values in the configuration cache. This removes old values.
   */
  private async refresh(): Promise<void> {
    const parameters = await this.fetch();
    const entries = parameters
      .filter(this.hasNameAndType.bind(this))
      .map(this.toLruEntry);
    this.cache.load(entries);
  }

  /**
   * Convert the given `param` to an object conforming to the `EnvironmentVariable`
   * interface.
   * @param param to be converted.
   * @return `undefined` if the given `param` can not be converted; the
   *    `EnvironmentVariable` otherwise.
   */
  private toEnvironmentVariable(param: Parameter): Option<EnvironmentVariable> {
    const path = param.Name || '';
    const data = path.match(this.keyMatcher);
    const key = (data && data[1]) || undefined;
    if (key === undefined || param.Value === undefined) {
      return undefined;
    } else {
      return {
        description: param.Description,
        key,
        path,
        value: param.Value,
        version: param.Version,
      };
    }
  }

  /**
   * Convert the given `param` to an object conforming to the `LRUEntry`
   * interface.
   * @param param to be converted.
   * @return an `LRUEntry` with `param` as value.
   */
  private toLruEntry(param: Parameter): LRU.LRUEntry<string, Parameter> {
    return {
      e: 0,
      k: param.Name!,
      v: param,
    };
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
