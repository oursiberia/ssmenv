import { SSM } from 'aws-sdk';
import { mkdir, readFile, stat, writeFile } from 'fs';
import { sep as pathSeparator } from 'path';
import { promisify } from 'util';

import {
  AWS_FILE_NAME,
  DEFAULT_CONFIG_PATH,
  PROJECT_FILE_NAME,
} from '../../constants';
import { Environment, Options } from '../../environment';
import { AwsSsmProxy } from '../../environment/AwsSsmProxy';
import { ConfigValidationError } from '../../errors';
import { Fn, Log } from '../../log';

import { AwsConfig, AwsRequiredProperties } from '../AwsConfig';
import { FullConfig } from '../ConfigTypes';
import { ProjectConfig, ProjectRequiredProperties } from '../ProjectConfig';

import { ConfigFile } from './ConfigFile';

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
  const awsFileName = `${pathToConfig}${pathSeparator}${AWS_FILE_NAME}`;
  const config = new ConfigFile<AwsConfig>(awsFileName, AwsRequiredProperties);
  return config.read();
}

/**
 * Read `Config` from `pathToConfig` allowing for partial results.
 * @param pathToConfig from which all configuration can be read.
 * @returns a `Config` where all properties are optional (may be `undefined`).
 */
export async function readConfig(pathToConfig: string = DEFAULT_CONFIG_PATH) {
  const awsFileName = `${pathToConfig}${pathSeparator}${AWS_FILE_NAME}`;
  const projectFileName = `${pathToConfig}${pathSeparator}${PROJECT_FILE_NAME}`;
  const awsConfig = new ConfigFile<AwsConfig>(
    awsFileName,
    AwsRequiredProperties
  );
  const projectConfig = new ConfigFile<ProjectConfig>(
    projectFileName,
    ProjectRequiredProperties
  );
  const config: Partial<FullConfig> = {
    ...(await awsConfig.partial()),
    ...(await projectConfig.partial()),
  };
  return config;
}

/**
 * Read `Project` from the given filesystem `pathToConfig`.
 * @param pathToConfig from which the `Project` can be read.
 * @returns the `Project` located at `pathToConfig`.
 * @throws `Error` if required properties are missing from the read config or if
 *    there is a problem with file I/O.
 */
async function readProjectConfig(pathToConfig: string = DEFAULT_CONFIG_PATH) {
  const projectFileName = `${pathToConfig}${pathSeparator}${PROJECT_FILE_NAME}`;
  const config = new ConfigFile<ProjectConfig>(
    projectFileName,
    ProjectRequiredProperties
  );
  return config.read();
}

/**
 * Writes the given `awsConfig` and `projectConfig` as JSON files within
 * `pathToConfig`.
 * @param awsConfig to write.
 * @param projectConfig to write.
 * @param pathToConfig filesystem path where the configuration will be written.
 * @returns the paths to which the files were written.
 * @throws if there is an unexpected error creating or opening `pathToConfig`.
 */
export async function writeConfig(
  config: FullConfig,
  pathToConfig: string = DEFAULT_CONFIG_PATH
): Promise<string[]> {
  const { accessKeyId, rootPath, secretAccessKey, stages } = config;
  const projectConfig: ProjectConfig = {
    rootPath,
    stages,
  };
  const awsConfig: AwsConfig = {
    accessKeyId,
    secretAccessKey,
  };
  const hasConfigDirectory = await ensureConfigDirectory(pathToConfig);
  if (!hasConfigDirectory) {
    throw new Error(`Unable to write into or create ${pathToConfig}.`);
  }
  const awsResult = writeAwsConfig(awsConfig, pathToConfig);
  const projectResult = writeProjectConfig(projectConfig, pathToConfig);
  return Promise.all([awsResult, projectResult]);
}

/**
 * Writes the given `awsConfig` as a JSON file within `pathToConfig`.
 * @param awsConfig to write.
 * @param pathToConfig filesystem path where the configuration will be written.
 * @returns the paths to which the file was written.
 */
function writeAwsConfig(awsConfig: AwsConfig, pathToConfig: string) {
  const awsFileName = `${pathToConfig}${pathSeparator}${AWS_FILE_NAME}`;
  const config = new ConfigFile<AwsConfig>(awsFileName, AwsRequiredProperties);
  return config.write(awsConfig);
}

/**
 * Writes the given `config` as a JSON file within `pathToConfig`.
 * @param config to write.
 * @param pathToConfig filesystem path where the configuration will be written.
 * @returns the paths to which the file was written.
 */
function writeProjectConfig(config: ProjectConfig, pathToConfig: string) {
  const projectFileName = `${pathToConfig}${pathSeparator}${PROJECT_FILE_NAME}`;
  const projectConfig = new ConfigFile<ProjectConfig>(
    projectFileName,
    ProjectRequiredProperties
  );
  return projectConfig.write(config);
}
