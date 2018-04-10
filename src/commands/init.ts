import { Command } from '@oclif/command';
import { args as Parser } from '@oclif/parser';
import chalk from 'chalk';
import { prompt, Question } from 'inquirer';

import { DEFAULT_CONFIG_PATH } from '../constants';
import { Environment } from '../environment';
import { make as makeExample } from '../example';
import { quietFlag, WithQuietFlag } from '../flags/quiet';
import { Config, readConfig, writeConfig } from '../projectConfig';

// Defined to name Args interface properties as constants.
const AWS_ACCESS = 'awsAccess';
const AWS_SECRET = 'awsSecret';
const ROOT_PATH = 'rootPath';

/**
 * Defines the interface of the answers received from `inquirer`
 */
interface Answers {
  awsAccess: string;
  awsSecret: string;
  rootPath: string;
}

/**
 * Defines the information received as positional arguments. It must be at least
 * a subset of `Answers`.
 */
interface Args extends Partial<Answers> {}

/** Defines the information received as flags. */
interface Flags extends WithQuietFlag {} // tslint:disable-line no-empty-interface

export class Init extends Command {
  static description = 'Create the configuration files for your project.';

  static examples = [
    makeExample([
      `# Create configuration with given parameters.`,
      `$ ssmenv init / FOO bar`,
      `Configuration written to .ssmenv/public.json and .ssmenv/private.json.`,
      `* Recommend adding .ssmenv/public.json to source control.`,
      `* Recommend ignoring .ssmenv/private.json in source control.`,
    ]),
    makeExample([
      `# Create configuration by using prompts.`,
      `# The value inside parentheses will be used as the default.`,
      `$ ssmenv init`,
      `? AWS Access Key ID`,
      `? AWS Secret Access Key`,
      `? Root Path (/)`,
      `Configuration written to .ssmenv/public.json and .ssmenv/private.json.`,
      `* Recommend adding .ssmenv/public.json to source control.`,
      `* Recommend ignoring .ssmenv/private.json in source control.`,
    ]),
  ];

  static flags = {
    quiet: quietFlag,
  };

  static args: Parser.IArg[] = [
    {
      description: 'Root path for the project.',
      name: ROOT_PATH,
    },
    {
      description: 'AWS Access Key Id to use when interacting with AWS API.',
      name: AWS_ACCESS,
    },
    {
      description: 'AWS Secret Key to use when interacting with AWS API.',
      name: AWS_SECRET,
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

  /**
   * Get the `Question` instances to prompt for based on the `Args` provided.
   * @param args which may provide answers to `Question`s already.
   * @returns the set of `Question`s to with their `when` condition set based on
   *    `args`.
   */
  private static questions(
    args: Args,
    defaults?: Partial<Answers>
  ): Question[] {
    return [
      {
        default: defaults && defaults.awsAccess,
        message: 'AWS Access Key ID',
        name: AWS_ACCESS,
        type: 'input',
        when: args.awsAccess === undefined,
      },
      {
        default: defaults && defaults.awsSecret,
        message: 'AWS Secret Access Key',
        name: AWS_SECRET,
        type: 'input',
        when: args.awsSecret === undefined,
      },
      {
        default: defaults && defaults.rootPath,
        message: 'Root Path',
        name: ROOT_PATH,
        type: 'input',
        validate: Init.isValidRootPath,
        when:
          args.rootPath === undefined ||
          Init.isValidRootPath(args.rootPath) !== true,
      },
    ];
  }

  async run() {
    const { args, flags } = this.parse<Flags, Args>(Init);
    const currentConfig = await readConfig(DEFAULT_CONFIG_PATH);
    const defaults: Partial<Answers> = {
      awsAccess: currentConfig.accessKeyId,
      awsSecret: currentConfig.secretAccessKey,
      rootPath: currentConfig.rootPath || '/',
    };
    const answers = await prompt<Answers>(Init.questions(args, defaults));
    const accessKeyId = args.awsAccess || answers.awsAccess;
    const rootPath = args.rootPath || answers.rootPath;
    const secretAccessKey = args.awsSecret || answers.awsSecret;
    // If checks didn't exit then we have valid values
    const config: Config = {
      accessKeyId,
      rootPath,
      secretAccessKey,
    };

    const paths = await writeConfig(config, DEFAULT_CONFIG_PATH);
    const keyword = chalk.keyword('green');
    const [awsPath, projectPath] = paths.map(v => keyword(v));
    const stdout = flags.quiet
      ? []
      : [
          `Configuration written to ${projectPath} and ${awsPath}.`,
          `* Recommend adding ${projectPath} to source control.`,
          `* Recommend ignoring ${awsPath} in source control.`,
        ];
    stdout.forEach(line => this.log(line));
  }
}
