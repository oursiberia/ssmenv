import { SSM } from 'aws-sdk';
import { mkdir } from 'fs';

import { DEFAULT_CONFIG_PATH } from '../../constants';
import { Environment, EnvironmentOptions } from '../../environment';
import { AwsSsmProxy } from '../../environment/AwsSsmProxy';

import { AwsConfig } from '../AwsConfig';
import { FullConfig } from '../ConfigTypes';
import { ProjectConfig } from '../ProjectConfig';

import { getAwsConfig, getProjectConfig } from './helpers';

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
  const awsConfig = await getAwsConfig(pathToConfig).read();
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
  options?: EnvironmentOptions,
  pathToConfig?: string
) {
  const awsConfig = await getAwsConfig(pathToConfig).read();
  const projectConfig = await getProjectConfig(pathToConfig).read();
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
 * Push give `stage` into the project config.
 * @param stage to add.
 * @param pathToConfig from which all configuration can be read.
 * @returns `true` after stage exists in the config.
 * @throws if `stage` can not be pushed into configuration.
 */
export async function pushStage(stage: string, pathToConfig?: string) {
  const projectFile = getProjectConfig(pathToConfig);
  const config = await projectFile.read();
  const stages = config.stages;
  if (stages.includes(stage)) {
    return true;
  } else {
    const newConfig = {
      ...config,
      stages: [...stages, stage],
    };
    const result = await projectFile.write(newConfig);
    return result === projectFile.fileName;
  }
}

/**
 * Read `Config` from `pathToConfig` allowing for partial results.
 * @param pathToConfig from which all configuration can be read.
 * @returns a `Config` where all properties are optional (may be `undefined`).
 */
export async function readConfig(pathToConfig?: string) {
  const awsConfig = getAwsConfig(pathToConfig);
  const projectConfig = getProjectConfig(pathToConfig);
  const config: Partial<FullConfig> = {
    ...(await awsConfig.partial()),
    ...(await projectConfig.partial()),
  };
  return config;
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
  const awsResult = getAwsConfig(pathToConfig).write(awsConfig);
  const projectResult = getProjectConfig(pathToConfig).write(projectConfig);
  return Promise.all([awsResult, projectResult]);
}
