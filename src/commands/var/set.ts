import { Command, flags } from '@oclif/command';
import { args } from '@oclif/parser';

import { KEY, STAGE, VALUE } from '../../constants';
import { getEnvironment } from '../../projectConfig';
import { parseTag, Tag, validateTag } from '../../tag';

interface Flags {
  tag: string[];
  description?: string;
  withEncryption?: string;
}

interface Args {
  KEY: string;
  STAGE: string;
  VALUE: string;
}

export default class VarSet extends Command {
  static description = 'Set the value of a variable. Creates it if it does not exist, creates a new version if it does.';

  static flags = {
    description: flags.string({
      char: 'd',
      description: 'Description of the variable.',
    }),
    tag: flags.string({
      char: 't',
      description: 'Tags to set on the variable as TagName:TagValue.',
      helpValue: 'TagName:TagValue',
      multiple: true,
      parse: validateTag,
    }),
    withEncryption: flags.string({
      char: 'k',
      description: 'Attempt to encrypt parameter using KMS key name.',
      helpValue: 'KMS Key ARN',
    }),
  };

  static args: args.IArg[] = [
    {
      description: 'Stage to use for retrieving data. Appended to root path.',
      name: STAGE,
      required: true,
    },
    {
      description: 'Key to use when setting the variable; AKA variable name.',
      name: KEY,
      required: true,
    },
    {
      description: 'Value to set.',
      name: VALUE,
      required: true,
    },
  ];

  async run() {
    const { args, flags } = this.parse<Flags, Args>(VarSet);
    const key = args.KEY;
    const stage = args.STAGE;
    const value = args.VALUE;
    if (stage === undefined) {
      throw new Error(`${STAGE} must be not provided.`);
    }
    const config = await getEnvironment(stage);
    const result = await config.put(key, value, flags.description);
    this.log(JSON.stringify(result, undefined, 2));
  }
}
