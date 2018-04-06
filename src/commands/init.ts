import { Command, flags } from '@oclif/command';
import chalk from 'chalk';
import { prompt, Question } from 'inquirer';
import {
  ACCESS_KEY_ID,
  DEFAULT_CONFIG_PATH,
  ROOT_PATH,
  SECRET_KEY_ID,
} from '../constants';
import { Environment } from '../environment';
import { AwsConfig, ProjectConfig, writeConfig } from '../projectConfig';

export default class Init extends Command {
  static description = 'Create a configuration files for your project.';

  static flags = {};

  static args = [
    {
      description: 'Root path for the project.',
      name: ROOT_PATH,
    },
    {
      description: 'AWS Access Key Id to use when interacting with AWS API.',
      name: ACCESS_KEY_ID,
    },
    {
      description: 'AWS Secret Key to use when interacting with AWS API.',
      name: SECRET_KEY_ID,
    },
  ];

  /**
   * Uses `Environment#validateRootPath` to check for errors but catches any
   * thrown to translate them into a `string` message.
   * @param input to be validated.
   * @return `true` if `input` is valid, a `string` message if `input` is not
   *    valid.
   */
  static isValidRootPath(input: string) {
    try {
      Environment.validateRootPath(input);
      return true;
    } catch (err) {
      if (err instanceof Error) {
        return err.message;
      } else {
        throw err;
      }
    }
  }

  async run() {
    const { args, flags } = this.parse(Init);
    const questions: Question[] = [
      {
        message: 'AWS Access Key ID',
        name: ACCESS_KEY_ID,
        type: 'input',
        when: args[ACCESS_KEY_ID] === undefined,
      },
      {
        message: 'AWS Secret Access Key',
        name: SECRET_KEY_ID,
        type: 'input',
        when: args[SECRET_KEY_ID] === undefined,
      },
      {
        default: '/',
        message: 'Root Path',
        name: ROOT_PATH,
        type: 'input',
        validate: Init.isValidRootPath,
        when:
          args[ROOT_PATH] === undefined ||
          Init.isValidRootPath(args[ROOT_PATH]) !== true,
      },
    ];
    const answers = await prompt(questions);
    const accessKeyId = args[ACCESS_KEY_ID] || answers[ACCESS_KEY_ID];
    const secretAccessKey = args[SECRET_KEY_ID] || answers[SECRET_KEY_ID];
    const rootPath = args[ROOT_PATH] || answers[ROOT_PATH];
    // If checks didn't exit then we have valid values
    const projectConfig: ProjectConfig = {
      rootPath,
    };
    const awsConfig: AwsConfig = {
      accessKeyId,
      secretAccessKey,
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
