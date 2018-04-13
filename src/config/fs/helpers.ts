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
 * @param fileName of the config file within `pathToConfig`
 * @returns a handler for the aws config file.
 */
export function getAwsConfig(
  pathToConfig: string = DEFAULT_CONFIG_PATH,
  fileName: string = AWS_FILE_NAME
) {
  const awsFileName = `${pathToConfig}${pathSeparator}${fileName}`;
  return new ConfigFile<AwsConfig>(awsFileName, AwsRequiredProperties);
}

/**
 * Create a new `ConfigFile` for the given configuration path.
 * @param pathToConfig from which the project config will be read.
 * @param fileName of the config file within `pathToConfig`
 * @returns a handler for the project config file.
 */
export function getProjectConfig(
  pathToConfig: string = DEFAULT_CONFIG_PATH,
  fileName: string = PROJECT_FILE_NAME
) {
  const projectFileName = `${pathToConfig}${pathSeparator}${fileName}`;
  return new ConfigFile<ProjectConfig>(
    projectFileName,
    ProjectRequiredProperties
  );
}
