import { SSM } from 'aws-sdk';
import { mkdir, readFile, stat, writeFile } from 'fs';
import { sep as pathSeparator } from 'path';
import {
  AWS_FILE_NAME,
  DEFAULT_CONFIG_PATH,
  PROJECT_FILE_NAME,
} from './constants';
import { Environment, Options } from './environment';
import { AwsSsmProxy } from './environment/AwsSsmProxy';
import { Fn, Log } from './log';

/**
 * Configuration necessary for connecting to AWS.
 */
export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
}

/**
 * Configuration indicating parameters to be read.
 */
export interface ProjectConfig {
  rootPath: string;
}

/**
 * Get direct access to `SSM` using the configuration written at `pathToConfig`.
 * @param pathToConfig from which the project config will be read.
 * @return an initialized `AWS.SSM` instance.
 */
export async function getDirectEnvironment(pathToConfig?: string) {
  const awsConfig = await readAwsConfig(pathToConfig);
  const ssm = getSSM(awsConfig);
  return new AwsSsmProxy(ssm);
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
  const awsConfig = await readAwsConfig(pathToConfig);
  const projectConfig = await readProjectConfig(pathToConfig);
  const ssm = getSSM(awsConfig);
  const rootPath = `${projectConfig.rootPath}${stage}`;
  return new Environment(rootPath, ssm, options);
}

/**
 * Create an `AWS.SSM` instance from the given `SsmenvConfig`.
 * @param config with API info.
 * @returns the initialized `AWS.SSM` instance ready to make requests.
 */
function getSSM(config: AwsConfig): SSM {
  return new SSM({
    accessKeyId: config.accessKeyId,
    apiVersion: '2014-11-06',
    region: 'us-east-1',
    secretAccessKey: config.secretAccessKey,
  });
}

/**
 * Read `AwsConfig` from the given filesystem `pathToConfig`.
 * @param pathToConfig from which the `AwsConfig` can be read.
 * @returns the `AwsConfig` located at `pathToConfig`.
 * @throws `Error` if required properties are missing from the read config or if
 *    there is a problem with file I/O.
 */
function readAwsConfig(pathToConfig: string = DEFAULT_CONFIG_PATH) {
  return new Promise<AwsConfig>((resolve, reject) => {
    const awsFileName = `${pathToConfig}${pathSeparator}${AWS_FILE_NAME}`;
    readFile(awsFileName, { encoding: 'utf8' }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const conf = JSON.parse(data);
        const props = Object.getOwnPropertyNames(conf);
        const hasAccessKeyId = props.indexOf('accessKeyId') !== -1;
        const hasSecretKeyId = props.indexOf('secretAccessKey') !== -1;
        if (hasAccessKeyId && hasSecretKeyId) {
          resolve(conf);
        } else {
          reject(new Error('Required properties are missing'));
        }
      }
    });
  });
}

/**
 * Read `Project` from the given filesystem `pathToConfig`.
 * @param pathToConfig from which the `Project` can be read.
 * @returns the `Project` located at `pathToConfig`.
 * @throws `Error` if required properties are missing from the read config or if
 *    there is a problem with file I/O.
 */
function readProjectConfig(pathToConfig: string = DEFAULT_CONFIG_PATH) {
  return new Promise<ProjectConfig>((resolve, reject) => {
    const projectFileName = `${pathToConfig}${pathSeparator}${PROJECT_FILE_NAME}`;
    readFile(projectFileName, { encoding: 'utf8' }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const conf = JSON.parse(data);
        const props = Object.getOwnPropertyNames(conf);
        const hasRootPath = props.indexOf('rootPath') !== -1;
        if (hasRootPath) {
          resolve(conf);
        } else {
          reject(new Error('Required properties are missing'));
        }
      }
    });
  });
}

/**
 * Writes the given `awsConfig` and `projectConfig` as JSON files within
 * `pathToConfig`.
 * @param awsConfig to write.
 * @param projectConfig to write.
 * @param pathToConfig filesystem path where the configuration will be written.
 * @returns the paths to which the files were written.
 */
export function writeConfig(
  awsConfig: AwsConfig,
  projectConfig: ProjectConfig,
  pathToConfig: string = DEFAULT_CONFIG_PATH
) {
  return ensureConfigDirectory(pathToConfig).then(() => {
    const awsResult = writeAwsConfig(awsConfig, pathToConfig);
    const projectResult = writeProjectConfig(projectConfig, pathToConfig);
    return Promise.all([awsResult, projectResult]);
  });
}

/**
 * Ensure the directory indicated by `pathToConfig` exists.
 * @param pathToConfig to ensure.
 * @returns `true` if successful.
 * @throws `NodeJS.ErrnoException` otherwise.
 */
function ensureConfigDirectory(pathToConfig: string) {
  return new Promise<boolean>((resolve, reject) => {
    mkdir(pathToConfig, 0o755, err => {
      if (err && err.code !== 'EEXIST') {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Writes the given `awsConfig` as a JSON file within `pathToConfig`.
 * @param awsConfig to write.
 * @param pathToConfig filesystem path where the configuration will be written.
 * @returns the paths to which the file was written.
 */
function writeAwsConfig(awsConfig: AwsConfig, pathToConfig: string) {
  return new Promise<string>((resolve, reject) => {
    const awsContents = JSON.stringify(awsConfig, undefined, 2);
    const awsFileName = `${pathToConfig}${pathSeparator}${AWS_FILE_NAME}`;
    writeFile(awsFileName, awsContents, 'utf8', err => {
      if (err) {
        reject(err);
      } else {
        resolve(awsFileName);
      }
    });
  });
}

/**
 * Writes the given `config` as a JSON file within `pathToConfig`.
 * @param config to write.
 * @param pathToConfig filesystem path where the configuration will be written.
 * @returns the paths to which the file was written.
 */
function writeProjectConfig(config: ProjectConfig, pathToConfig: string) {
  return new Promise<string>((resolve, reject) => {
    const projectContents = JSON.stringify(config, undefined, 2);
    const projectFileName = `${pathToConfig}${pathSeparator}${PROJECT_FILE_NAME}`;
    writeFile(projectFileName, projectContents, 'utf8', err => {
      if (err) {
        reject(err);
      } else {
        resolve(projectFileName);
      }
    });
  });
}
