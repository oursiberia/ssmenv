import { Command, flags } from '@oclif/command';
import { args as Parser } from '@oclif/parser';

import { Key, keyPositional } from '../../arguments/key';
import { getEnvironment, pushStage } from '../../config/fs';
import { make as makeExample } from '../../example';
import { stageFlag, WithStageFlag } from '../../flags/stage';

interface Flags extends WithStageFlag {} // tslint:disable-line no-empty-interface

interface Args extends Key {} // tslint:disable-line no-empty-interface

export default class VarDel extends Command {
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

  async run() {
    const { args, flags } = this.parse<Flags, Args>(VarDel);
    const { key } = args;
    const stages = flags.stage;
    // Despite what the inferred signature of `flags` indicates `stage` can be undefined
    if (stages === undefined || stages.length === 0) {
      this.error('At least one stage is required for `var:del`.', { exit: 1 });
    }
    const results = await Promise.all(
      stages.map(stage => this.deleteKey(stage, key))
    );
    if (results.some(result => result === undefined)) {
      this.exit(1);
    }
  }

  private async deleteKey(stage: string, key: string) {
    try {
      await pushStage(stage);
    } catch (pushError) {
      this.error(`Book keeping - failed to save ${stage} to project config.`);
    }
    try {
      const environment = await getEnvironment(stage);
      return await environment.del(key);
    } catch (err) {
      this.error(`Failed to set value for '${key}' in stage, ${stage}.`);
    }
  }
}
