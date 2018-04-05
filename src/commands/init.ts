import { Command, flags } from '@oclif/command';
import chalk from 'chalk';
import {
  ACCESS_KEY_ID,
  DEFAULT_CONFIG_PATH,
  ROOT_PATH,
  SECRET_KEY_ID,
} from '../constants';
import { AwsConfig, ProjectConfig, writeConfig } from '../projectConfig';

export default class Init extends Command {
  static description = 'Create a configuration file for your project.';

  static flags = {
    path: flags.string({
      char: 'p',
      default: '/',
      description: 'Root path for the project.',
    }),
  };

  static args = [
    {
      description: 'AWS Access Key Id to use when interacting with AWS API.',
      name: ACCESS_KEY_ID,
      required: true,
    },
    {
      description: 'AWS Secret Key to use when interacting with AWS API.',
      name: SECRET_KEY_ID,
      required: true,
    },
  ];

  async run() {
    const { args, flags } = this.parse(Init);
    const path = flags.path;
    if (args[ACCESS_KEY_ID] === undefined) {
      throw new Error(`${ACCESS_KEY_ID} not provided.`);
    } else if (args[SECRET_KEY_ID] === undefined) {
      throw new Error(`${SECRET_KEY_ID} not provided.`);
    } else if (path === undefined) {
      throw new Error(`${ROOT_PATH} not provided.`);
    } else if (!path.startsWith('/')) {
      throw new Error(`path must start with a /; '${path}' was given.`);
    }
    // If checks didn't exit then we have valid values
    const projectConfig: ProjectConfig = {
      rootPath: path!,
    };
    const awsConfig: AwsConfig = {
      accessKeyId: args[ACCESS_KEY_ID]!,
      secretAccessKey: args[SECRET_KEY_ID]!,
    };

    const contents = JSON.stringify(projectConfig, undefined, 2);
    const result = writeConfig(
      awsConfig,
      projectConfig,
      DEFAULT_CONFIG_PATH
    ).then(paths => {
      const keyword = chalk.keyword('green');
      const [awsPath, projectPath] = paths.map(v => keyword(v));
      const stdout = [
        `Configuration written to ${projectPath} and ${awsPath}.`,
        `* Recommend adding ${projectPath} to source control.`,
        `* Recommend ignoring ${awsPath} in source control.`,
      ];
      stdout.forEach(this.log.bind(this));
    });
    return result;
  }
}
