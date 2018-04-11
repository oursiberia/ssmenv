import { Command, flags } from '@oclif/command';
import { args as Parser } from '@oclif/parser';

import { Key, keyPositional } from '../../arguments/key';
import { Stage, stagePositional } from '../../arguments/stage';
import { Value, valuePositional } from '../../arguments/value';
import { getEnvironment, pushStage } from '../../config/fs';
import { make as makeExample } from '../../example';
import { descriptionFlag, WithDescriptionFlag } from '../../flags/description';
import { stageFlag, WithStageFlag } from '../../flags/stage';

interface Flags extends WithDescriptionFlag, WithStageFlag {}

interface Args extends Key, Value {}

export class VarSet extends Command {
  static description = 'Set the value of a variable. Creates it if it does not exist, creates a new version if it does.';

  static examples = [
    makeExample([
      `# Set value of FOO variable in test stage.`,
      `$ ssmenv var:set --stage=test FOO bar`,
    ]),
    makeExample([
      `# Set value of FOO variable for staging with a description.`,
      `$ ssmenv var:set --stage=staging FOO "bar baz" --description="A description of FOO"`,
    ]),
  ];

  static flags = {
    description: descriptionFlag,
    stage: stageFlag,
  };

  static args: Parser.IArg[] = [keyPositional, valuePositional];

  async run() {
    const { args, flags } = this.parse<Flags, Args>(VarSet);
    const { key, value } = args;
    const stages = flags.stage;
    // Despite what the inferred signature of `flags` indicates `stage` can be undefined
    if (stages === undefined || stages.length === 0) {
      this.error('At least one stage is required for `var:del`.', { exit: 1 });
    }
    const results = await Promise.all(
      stages.map(stage => this.put(stage, key, value, flags.description))
    );
    if (results.some(result => result === undefined)) {
      this.exit(1);
    }
  }

  private async put(stage: string, key: string, value: string, desc?: string) {
    try {
      await pushStage(stage);
    } catch (pushError) {
      this.error(`Book keeping - failed to save ${stage} to project config.`);
    }
    try {
      const environment = await getEnvironment(stage);
      return environment.put(key, value, desc);
    } catch (err) {
      this.error(`Failed to set value for '${key}' in stage, ${stage}.`);
    }
  }
}
