import { Command, flags } from '@oclif/command';
import { args as Parser } from '@oclif/parser';
import chalk from 'chalk';
import { prompt, Question } from 'inquirer';

import { DEFAULT_CONFIG_PATH } from '../constants';
import { Environment } from '../environment';
import { make as makeExample } from '../example';
import { quietFlag, WithQuietFlag } from '../flags/quiet';
import { stageFlag, WithStageFlag } from '../flags/stage';
import { Config, readConfig, writeConfig } from '../projectConfig';

// Defined to name Args interface properties as constants.
const AWS_ACCESS = 'awsAccess';
const AWS_SECRET = 'awsSecret';
const ROOT_PATH = 'rootPath';
const STAGES = 'stages';

/**
 * Defines the interface of the answers received from `inquirer`
 */
interface Answers {
  awsAccess: string;
  awsSecret: string;
  rootPath: string;
  stages: string;
}

type AnswerKey = keyof Answers;
type ShouldQuestion = Record<AnswerKey, boolean>;

/**
 * Defines the information received as positional arguments. It must be at least
 * a subset of `Answers`.
 */
interface Args extends Partial<Answers> {}

/** Defines the information received as flags. */
interface Flags extends WithQuietFlag, WithStageFlag {} // tslint:disable-line no-empty-interface

export class Init extends Command {
  static description = 'Create the configuration files for your project.';

  static examples = [
    makeExample([
      `# Create configuration with given parameters.`,
      `$ ssmenv init --stage=production / FOO bar`,
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
      `? Comma Separated Stages (development,production,staging,test)`,
      `Configuration written to .ssmenv/public.json and .ssmenv/private.json.`,
      `* Recommend adding .ssmenv/public.json to source control.`,
      `* Recommend ignoring .ssmenv/private.json in source control.`,
    ]),
  ];

  static flags = {
    quiet: quietFlag,
    stage: stageFlag,
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
   * Uses `Environment#validatePathPart` to check for errors but catches any
   * thrown to translate them into a `string` message.
   * @param input to be validated.
   * @return `true` if `input` is valid, a `string` message if `input` is not
   *    valid.
   */
  static isValidPathPart(input: string) {
    try {
      Environment.validatePathPart('Stage', input);
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
   * Uses `isValidPathPart` to check for errors in the comma separated list of
   * path parts in `input.
   * @param input of comma separated path parts to validate.
   * @return `true` if `input` is valid, a `string` message if `input` is not
   *    valid.
   */
  static isValidPathParts(input: string) {
    const parts = input.split(',');
    const isValidResults = parts
      .map(Init.isValidPathPart)
      .filter(result => typeof result === 'string');
    if (isValidResults.length === 0) {
      // no parts were invalid so `input` is valid.
      return true;
    } else {
      // return a single string
      return isValidResults.join(' ');
    }
  }

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
   * Create default values for Questions based on current configuration, given
   * `args` and given `flags`.
   * @param args parsed for to the current execution.
   * @param flags parsed for the current execution.
   * @return values to uses as defaults if a new value is not provided.
   */
  private static async defaultAnswers(
    args: Args,
    flags: Flags
  ): Promise<Partial<Answers>> {
    const currentConfig = await readConfig(DEFAULT_CONFIG_PATH);
    return {
      awsAccess: args.awsAccess || currentConfig.accessKeyId,
      awsSecret: args.awsSecret || currentConfig.secretAccessKey,
      rootPath: args.rootPath || currentConfig.rootPath || '/',
      stages:
        (flags.stage && flags.stage.join(',')) ||
        (currentConfig.stages && currentConfig.stages.join(',')) ||
        'development,production,staging,test',
    };
  }

  /**
   * Create mapping indicating if a configuration value must be prompted.
   * @param args parsed for to the current execution.
   * @param flags parsed for the current execution.
   * @return a mapping of keys from `Answers` to boolean values, `true`
   *    indicating the question should be prompted.
   */
  private static isMissingAnswer(args: Args, flags: Flags): ShouldQuestion {
    return {
      awsAccess: args.awsAccess === undefined,
      awsSecret: args.awsSecret === undefined,
      rootPath:
        args.rootPath === undefined ||
        Init.isValidRootPath(args.rootPath) !== true,
      stages:
        flags.stage === undefined ||
        flags.stage.length === 0 ||
        Init.isValidPathParts(flags.stage.join(',')) !== true,
    };
  }

  /**
   * Get the `Question` instances to prompt for based on the `Args` provided.
   * @param args which may provide answers to `Question`s already.
   * @param flags which may provide answers to `Question`s already.
   * @returns the set of `Question`s to with their `when` condition set based on
   *    `args`.
   */
  private static async questions(
    args: Args,
    flags: Flags
  ): Promise<Question[]> {
    const isMissingValue = Init.isMissingAnswer(args, flags);
    const defaults = await Init.defaultAnswers(args, flags);
    return [
      {
        default: defaults.awsAccess,
        message: 'AWS Access Key ID',
        name: AWS_ACCESS,
        type: 'input',
        when: isMissingValue.awsAccess,
      },
      {
        default: defaults.awsSecret,
        message: 'AWS Secret Access Key',
        name: AWS_SECRET,
        type: 'input',
        when: isMissingValue.awsSecret,
      },
      {
        default: defaults.rootPath,
        message: 'Root Path',
        name: ROOT_PATH,
        type: 'input',
        validate: Init.isValidRootPath,
        when: isMissingValue.rootPath,
      },
      {
        default: defaults.stages,
        message: 'Comma Separated Stages',
        name: STAGES,
        type: 'input',
        validate: Init.isValidPathParts,
        when: isMissingValue.stages,
      },
    ];
  }

  async run() {
    const { args, flags } = this.parse<Flags, Args>(Init);
    const questions = await Init.questions(args, flags);
    const answers = await prompt<Answers>(questions);
    const accessKeyId = args.awsAccess || answers.awsAccess;
    const rootPath = args.rootPath || answers.rootPath;
    const secretAccessKey = args.awsSecret || answers.awsSecret;
    // Despite what the inferred signature of `flags` indicates `stage` can be undefined
    const stages = flags.stage || answers.stages.split(',');
    // If checks didn't exit then we have valid values
    const config: Config = {
      accessKeyId,
      rootPath,
      secretAccessKey,
      stages,
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
