import { Command, flags } from '@oclif/command';
import { args as Parser } from '@oclif/parser';

import { Stage, stagePositional } from '../../arguments/stage';
import { getEnvironment } from '../../projectConfig';

interface Flags {
  withDecryption: boolean;
}

interface Args extends Stage {} // tslint:disable-line no-empty-interface

export default class EnvDotenv extends Command {
  static description = 'Create a .env file from stored parameters.';

  static flags = {
    withDecryption: flags.boolean({
      description: 'Attempt to decrypt parameters using KMS keys.',
    }),
  };

  static args: Parser.IArg[] = [stagePositional];

  async run() {
    const { args, flags } = this.parse<Flags, Args>(EnvDotenv);
    const { stage } = args;
    const config = await getEnvironment(stage, {
      WithDecryption: flags.withDecryption,
    });
    const isReady = await config.isReady;
    if (!isReady) {
      throw new Error('Unable to read from parameter store.');
    }
    config.variables
      .map(envVar => `${envVar.key.toUpperCase()}=${envVar.value}`)
      .forEach(this.log.bind(this));
  }
}
