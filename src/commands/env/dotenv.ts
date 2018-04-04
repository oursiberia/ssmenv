import { Command, flags } from '@oclif/command';

import { getConfig } from '../../conf';
import { STAGE } from '../../constants';

interface Flags {
  withDecryption: boolean;
}

interface Args {
  STAGE: string | undefined;
}

export default class EnvDotenv extends Command {
  static description = 'Create a .env file from stored parameters.';

  static flags = {
    withDecryption: flags.boolean({
      description: 'Attempt to decrypt parameters using KMS keys.',
    }),
  };

  static args = [
    {
      description: 'Stage to use for retrieving data. Appended to root path.',
      name: STAGE,
      required: true,
    },
  ];

  async run() {
    const { args, flags } = this.parse<Flags, Args>(EnvDotenv);
    const stage = args[STAGE];
    if (stage === undefined) {
      throw new Error(`${STAGE} must be not provided.`);
    }
    const config = await getConfig(stage, {
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
