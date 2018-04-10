import { sep as pathSeparator } from 'path';
import {
  AWS_FILE_NAME,
  DEFAULT_CONFIG_PATH,
  PROJECT_FILE_NAME,
} from '../../constants';
import { AwsConfig, AwsRequiredProperties } from '../AwsConfig';
import { ProjectConfig, ProjectRequiredProperties } from '../ProjectConfig';
import { ConfigFile } from './ConfigFile';

/**
 * Create a new `ConfigFile` for the given configuration path.
 * @param pathToConfig from which the aws config will be read.
 * @returns a handler for the aws config file.
 */
export function getAwsConfig(pathToConfig: string = DEFAULT_CONFIG_PATH) {
  const awsFileName = `${pathToConfig}${pathSeparator}${AWS_FILE_NAME}`;
  return new ConfigFile<AwsConfig>(awsFileName, AwsRequiredProperties);
}

/**
 * Create a new `ConfigFile` for the given configuration path.
 * @param pathToConfig from which the aws config will be read.
 * @returns a handler for the project config file.
 */
export function getProjectConfig(pathToConfig: string = DEFAULT_CONFIG_PATH) {
  const projectFileName = `${pathToConfig}${pathSeparator}${PROJECT_FILE_NAME}`;
  return new ConfigFile<ProjectConfig>(
    projectFileName,
    ProjectRequiredProperties
  );
}
