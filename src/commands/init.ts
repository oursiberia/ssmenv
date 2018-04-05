import { Command, flags } from '@oclif/command';
import { ProjectConfig, writeConfig } from '../conf';
import {
  ACCESS_KEY_ID,
  DEFAULT_CONFIG_PATH,
  ROOT_PATH,
  SECRET_KEY_ID,
} from '../constants';

export default class Init extends Command {
  static description = 'Create a configuration file for your project.';

  static flags = {
    path: flags.string({
      char: 'p',
      default: '/',
      description: 'Root path for the project.',
    }),
  };

  // tslint:disable object-literal-sort-keys
  static args = [
    {
      name: ACCESS_KEY_ID,
      required: true,
      description: 'AWS Access Key Id to use when interacting with AWS API.',
    },
    {
      name: SECRET_KEY_ID,
      required: true,
      description: 'AWS Secret Key to use when interacting with AWS API.',
    },
  ];
  // tslint:enable object-literal-sort-keys

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
    const config: ProjectConfig = {
      AWS_ACCESS_KEY: args[ACCESS_KEY_ID]!,
      AWS_SECRET_KEY: args[SECRET_KEY_ID]!,
      ROOT_PATH: path!,
    };

    const contents = JSON.stringify(config, undefined, 2);
    const result = writeConfig(config, DEFAULT_CONFIG_PATH).then(
      pathToConfig => {
        this.log(
          `Configuration written to ${pathToConfig}. Please add it to SCM ignore.`
        );
      }
    );
    return result;
  }
}
