import { Command, flags } from '@oclif/command';
import { args as Parser } from '@oclif/parser';

import { Key, keyPositional } from '../../arguments/key';
import { Stage, stagePositional } from '../../arguments/stage';
import { Value, valuePositional } from '../../arguments/value';
import { make as makeExample } from '../../example';
import { getEnvironment } from '../../projectConfig';
import { parseTag, Tag, validateTag } from '../../tag';

interface Flags {
  tag: string[];
  description?: string;
  withEncryption?: string;
}

interface Args extends Key, Stage, Value {}

export class VarSet extends Command {
  static description = 'Set the value of a variable. Creates it if it does not exist, creates a new version if it does.';

  static examples = [
    makeExample([
      `# Set value of FOO variable in test stage.`,
      `$ ssmenv var:set test FOO bar`,
      `{`,
      `  "key": "FOO",`,
      `  "path": "/test/FOO",`,
      `  "value": "bar",`,
      `  "version": 1`,
      `}`,
    ]),
    makeExample([
      `# Set value of FOO variable for staging with a description.`,
      `$ ssmenv var:set staging FOO "bar baz" --description="A description of FOO"`,
      `{`,
      `  "key": "FOO",`,
      `  "path": "/staging/FOO",`,
      `  "description": "A description of FOO"`,
      `  "value": "bar baz",`,
      `  "version": 1`,
      `}`,
    ]),
  ];

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
    const environment = await getEnvironment(stage);
    const result = await environment.put(key, value, flags.description);
    this.log(JSON.stringify(result, undefined, 2));
  }
}
