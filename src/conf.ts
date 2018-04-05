import { SSM } from 'aws-sdk';
import { readFile, writeFile } from 'fs';
import {
  ACCESS_KEY_ID,
  CONFIG_FILE,
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

export async function getConfig(
  stage: string,
  options?: Options,
  path?: string
): Promise<Environment> {
  const config = await readConfig(path);
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

function readConfig(path: string = CONFIG_FILE): Promise<Conf> {
  return new Promise((resolve, reject) => {
    readFile(path, { encoding: 'utf8' }, (err, data) => {
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

export function writeConfig(
  config: Conf,
  path: string = CONFIG_FILE,
  log: Log = Fn
) {
  const result: Promise<void> = new Promise((resolve, reject) => {
    writeFile(path, JSON.stringify(config, undefined, 2), err => {
      if (err) {
        reject(err);
      } else {
        log(
          `Configuration written to ${CONFIG_FILE}. Please add it to SCM ignore.`
        );
        resolve();
      }
    });
  });
  return result;
}
