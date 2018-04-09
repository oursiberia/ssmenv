import { Command, flags } from '@oclif/command';
import { args as Parser } from '@oclif/parser';

import { Key, keyPositional } from '../../arguments/key';
import { Stage, stagePositional } from '../../arguments/stage';
import { Value, valuePositional } from '../../arguments/value';
import { make as makeExample } from '../../example';
import { descriptionFlag, WithDescriptionFlag } from '../../flags/description';
import { getEnvironment } from '../../projectConfig';
import { parseTag, Tag, validateTag } from '../../tag';

interface Flags extends WithDescriptionFlag {} // tslint:disable-line no-empty-interface

interface Args extends Key, Stage, Value {}

export class VarSet extends Command {
  static description = 'Set the value of a variable. Creates it if it does not exist, creates a new version if it does.';

  static examples = [
    makeExample([
      `# Set value of FOO variable in test stage.`,
      `$ ssmenv var:set test FOO bar`,
    ]),
    makeExample([
      `# Set value of FOO variable for staging with a description.`,
      `$ ssmenv var:set staging FOO "bar baz" --description="A description of FOO"`,
    ]),
  ];

  static flags = {
    description: descriptionFlag,
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
  }
}
