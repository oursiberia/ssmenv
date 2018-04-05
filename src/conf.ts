import { SSM } from 'aws-sdk';
import { readFile, writeFile } from 'fs';
import {
  ACCESS_KEY_ID,
  DEFAULT_CONFIG_PATH,
  ROOT_PATH,
  SECRET_KEY_ID,
} from './constants';
import { Environment, Options } from './environment';
import { Fn, Log } from './log';

export interface ProjectConfig {
  AWS_ACCESS_KEY: string;
  AWS_SECRET_KEY: string;
  ROOT_PATH: string;
}

/**
 * Retrieve an `Environment` for the given `stage` using the given `options` and
 * configuration from `pathToConfig`.
 * @param stage of project to be combined with the project's root path.
 * @param options to use when initializing `Environment`.
 * @param pathToConfig from which the project config will be read.
 * @returns the initialized `Environment`.
 */
export async function getEnvironment(
  stage: string,
  options?: Options,
  pathToConfig?: string
) {
  const config = await readConfig(pathToConfig);
  const ssm = getSSM(config);
  const rootPath = `${config.ROOT_PATH}${stage}`;
  return new Environment(rootPath, ssm, options);
}

/**
 * Create an `AWS.SSM` instance from the given `SsmenvConfig`.
 * @param config with API info.
 * @returns the initialized `AWS.SSM` instance ready to make requests.
 */
function getSSM(config: ProjectConfig): SSM {
  return new SSM({
    accessKeyId: config.AWS_ACCESS_KEY,
    apiVersion: '2014-11-06',
    region: 'us-east-1',
    secretAccessKey: config.AWS_SECRET_KEY,
  });
}

/**
 * Read `SsmenvConfig` from the given filesystem `pathToConfig`.
 * @param pathToConfig from which the `SsmenvConfig` can be read.
 * @returns the `SsmenvConfig` located at `pathToConfig`.
 * @throws `Error` if required properties are missing from the read config or if
 *    there is a problem with file I/O.
 */
function readConfig(pathToConfig: string = DEFAULT_CONFIG_PATH) {
  return new Promise<ProjectConfig>((resolve, reject) => {
    readFile(pathToConfig, { encoding: 'utf8' }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const conf = JSON.parse(data);
        const props = Object.getOwnPropertyNames(conf);
        const hasAccessKeyId = props.indexOf(ACCESS_KEY_ID) !== -1;
        const hasSecretKeyId = props.indexOf(SECRET_KEY_ID) !== -1;
        const hasRootPath = props.indexOf(ROOT_PATH) !== -1;
        if (hasAccessKeyId && hasRootPath && hasSecretKeyId) {
          resolve(conf);
        } else {
          reject(new Error('Required properties are missing'));
        }
      }
    });
  });
}

/**
 * Writes the given `config` as JSON to `pathToConfig`.
 * @param config to write store.
 * @param pathToConfig filesystem path where the configuration will be written.
 * @returns the path to which the file was written.
 */
export function writeConfig(
  config: ProjectConfig,
  pathToConfig: string = DEFAULT_CONFIG_PATH
) {
  const result = new Promise<string>((resolve, reject) => {
    const contents = JSON.stringify(config, undefined, 2);
    writeFile(pathToConfig, contents, err => {
      if (err) {
        reject(err);
      } else {
        resolve(pathToConfig);
      }
    });
  });
  return result;
}
