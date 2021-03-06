import { flags } from '@oclif/command'; // tslint:disable-line no-unused-variable
import { args as Parser } from '@oclif/parser';

import { Key, keyPositional } from '../../arguments/key';
import { StageActorCommand } from '../../command/StageActorCommand';
import { getEnvironment } from '../../config/fs';
import { make as makeExample } from '../../example';
import { stageFlag, WithStageFlag } from '../../flags/stage';

// tslint:disable-next-line no-empty-interface
export interface Flags extends WithStageFlag {}

// tslint:disable-next-line no-empty-interface
export interface Args extends Key {}

export default class VarDel extends StageActorCommand<Args, Flags, boolean> {
  static description = 'Delete a variable.';

  static examples = [
    makeExample([
      `# Delete variable FOO in test stage.`,
      `$ ssmenv var:del --stage=test FOO`,
    ]),
  ];

  static flags = {
    stage: stageFlag,
  };

  static args: Parser.IArg[] = [keyPositional];

  // tslint:disable-next-line variable-name
  async runOnStage(stage: string, args: Args, _flags: Flags) {
    const { key } = args;
    try {
      const environment = await getEnvironment(stage);
      return await environment.del(key);
    } catch (err) {
      this.error(`Failed to set value for '${key}' in stage, ${stage}.`);
      return;
    }
  }
}
