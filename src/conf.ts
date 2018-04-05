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

export interface Conf {
  AWS_ACCESS_KEY: string;
  AWS_SECRET_KEY: string;
  ROOT_PATH: string;
}

export async function getEnvironment(
  stage: string,
  options?: Options,
  pathToConfig?: string
): Promise<Environment> {
  const config = await readConfig(pathToConfig);
  const ssm = await getSSM(config);
  const rootPath = `${config.ROOT_PATH}${stage}`;
  return new Environment(rootPath, ssm, options);
}

async function getSSM(config: Conf): Promise<SSM> {
  return new SSM({
    accessKeyId: config.AWS_ACCESS_KEY,
    apiVersion: '2014-11-06',
    region: 'us-east-1',
    secretAccessKey: config.AWS_SECRET_KEY,
  });
}

function readConfig(pathToConfig: string = DEFAULT_CONFIG_PATH): Promise<Conf> {
  return new Promise((resolve, reject) => {
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
  config: Conf,
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
