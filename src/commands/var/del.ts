import { Command, flags } from '@oclif/command';
import { args as Parser } from '@oclif/parser';

import { Key, keyPositional } from '../../arguments/key';
import { Stage, stagePositional } from '../../arguments/stage';
import { make as makeExample } from '../../example';
import { getEnvironment } from '../../projectConfig';

interface Flags {} // tslint:disable-line no-empty-interface

interface Args extends Key, Stage {}

export default class VarDel extends Command {
  static description = 'Delete a variable.';

  static examples = [
    makeExample([
      `# Delete variable FOO in test stage.`,
      `$ ssmenv var:del test FOO`,
    ]),
  ];

  static flags = {};

  static args: Parser.IArg[] = [stagePositional, keyPositional];

  async run() {
    const { args, flags } = this.parse<Flags, Args>(VarDel);
    const { key, stage } = args;
    const environment = await getEnvironment(stage);
    const result = await environment.del(key);
    if (result === false) {
      this.exit(1);
    }
  }
}
