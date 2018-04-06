import { Command, flags } from '@oclif/command';
import { args as Parser } from '@oclif/parser';

import { Key, keyPositional } from '../../arguments/key';
import { Stage, stagePositional } from '../../arguments/stage';
import { Value, valuePositional } from '../../arguments/value';
import { getEnvironment } from '../../projectConfig';
import { parseTag, Tag, validateTag } from '../../tag';

interface Flags {
  tag: string[];
  description?: string;
  withEncryption?: string;
}

interface Args extends Key, Stage, Value {}

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

  static args: Parser.IArg[] = [
    stagePositional,
    keyPositional,
    valuePositional,
  ];

  async run() {
    const { args, flags } = this.parse<Flags, Args>(VarSet);
    const { key, stage, value } = args;
    const config = await getEnvironment(stage);
    const result = await config.put(key, value, flags.description);
    this.log(JSON.stringify(result, undefined, 2));
  }
}
