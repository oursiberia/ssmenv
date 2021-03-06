import { Command, flags } from '@oclif/command';
import { args as Parser } from '@oclif/parser';

import { Stage, stagePositional } from '../../arguments/stage';
import { getEnvironment } from '../../config/fs';
import { make as makeExample } from '../../example';

interface Flags {
  withDecryption: boolean;
}

interface Args extends Stage {} // tslint:disable-line no-empty-interface

export class EnvDotenv extends Command {
  static description = 'Generate .env compatible output from stored parameters.';

  static examples = [
    makeExample([
      `# Write test stage to STDOUT; assumes "FOO" and "foo" are set as vars.`,
      `$ ssmenv env:dotenv test`,
      `FOO=bar`,
      `foo=baz`,
    ]),
    makeExample([
      `# Write test stage to .env.test`,
      `$ ssmenv env:dotenv test > .env.test`,
    ]),
  ];

  static flags = {
    withDecryption: flags.boolean({
      description: 'Attempt to decrypt parameters using accessible KMS keys.',
    }),
  };

  static args: Parser.IArg[] = [stagePositional];

  async run() {
    const { args, flags } = this.parse<Flags, Args>(EnvDotenv);
    const { stage } = args;
    const config = await getEnvironment(stage, {
      withDecryption: flags.withDecryption,
    });
    const isReady = await config.isReady;
    if (!isReady) {
      throw new Error('Unable to read from parameter store.');
    }
    config.variables
      .map(envVar => `${envVar.key.toUpperCase()}=${envVar.value}`)
      .forEach(line => this.log(line));
  }
}
