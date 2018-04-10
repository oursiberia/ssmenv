import { readFile, stat, writeFile } from 'fs';
import { sep as pathSeparator } from 'path';
import { promisify } from 'util';

import { ConfigValidationError } from '../../errors';
import { AwsConfig } from '../AwsConfig';
import { AnyConfig, ConfigProperty } from '../ConfigTypes';
import { ProjectConfig } from '../ProjectConfig';

const reader = promisify(readFile);
const writer = promisify(writeFile);

/**
 * Read given `fileName` from disk as a JSON object.
 * @param T type parameter for the `Partial` returned by reading `fileName`.
 * @param fileName of the JSON file to be read.
 * @returns the contents of `fileName` as a `Partial<T>`.
 */
async function read<T>(fileName: string) {
  const data = await reader(fileName, { encoding: 'utf8' });
  return JSON.parse(data) as Partial<T>;
}

/**
 * Writes the given `T` as a JSON file within `pathToConfig`.
 * @param T type parameter for the `config` object to write into `fileName`.
 * @param config to write.
 * @param pathToConfig filesystem path where the configuration will be written.
 * @returns the paths to which the file was written.
 */
async function write<T>(config: T, fileName: string) {
  const contents = JSON.stringify(config);
  await writer(fileName, contents, 'utf8');
  return fileName;
}

/**
 * Validate the given `config` can possesses properties in `required`.
 * @param required properties to test exist in config.
 * @param config to test can be a `ProjectConfig`.
 * @param fileName to use in error messages.
 * @throws `ConfigValidationError` if `config` is missing any required
 *    properties.
 */
function validateConfig(required: string[], config: object, fileName: string) {
  const props = Object.getOwnPropertyNames(config);
  required.forEach(requiredProperty => {
    if (props.indexOf(requiredProperty) === -1) {
      throw new ConfigValidationError(requiredProperty, fileName);
    }
  });
}

export class ConfigFile<T extends AnyConfig> {
  private fileName: string;
  private requiredProperties: Array<ConfigProperty<T>>;
  constructor(fileName: string, requiredProperties: Array<ConfigProperty<T>>) {
    this.fileName = fileName;
    this.requiredProperties = requiredProperties;
  }
  /**
   * Read file for this config from disk as a JSON object.
   * @returns the contents of `fileName` as a `Partial<T>`.
   */
  async partial() {
    return read<T>(this.fileName);
  }
  /**
   * Read a `T` from the filesystem.
   * @returns the `T` from the filesystem.
   * @throws `Error` if required properties are missing from the read config or
   *    if there is a problem with file I/O.
   */
  async read() {
    const config = await this.partial();
    this.validate(config);
    return config as T;
  }
  /**
   * Writes the given `config` object as a JSON to the filesystem.
   * @param config to write.
   * @returns the paths to which the file was written.
   */
  async write(config: T) {
    return write(config, this.fileName);
  }
  /**
   * Validate the given `config` possesses properties required of `T`.
   * @param config to test can be used as an instance of `T`.
   * @throws `ConfigValidationError` if `config` is missing any required
   *    properties.
   */
  validate(config: object) {
    validateConfig(this.requiredProperties, config, this.fileName);
  }
}
