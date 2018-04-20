import { Command, flags } from '@oclif/command';
import { args as Parser } from '@oclif/parser';
import { EnvironmentVariable } from 'ssmenv';

import { Key, keyPositional } from '../../arguments/key';
import { Value, valuePositional } from '../../arguments/value';
import { StageActorCommand } from '../../command/StageActorCommand';
import { getEnvironment } from '../../config/fs';
import { make as makeExample } from '../../example';
import { descriptionFlag, WithDescriptionFlag } from '../../flags/description';
import { stageFlag, WithStageFlag } from '../../flags/stage';

export interface Flags extends WithDescriptionFlag, WithStageFlag {}

export interface Args extends Key, Value {}

export class VarSet extends StageActorCommand<
  Args,
  Flags,
  EnvironmentVariable
> {
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

  async runOnStage(stage: string, args: Args, flags: Flags) {
    const { key, value } = args;
    const description = flags.description;
    try {
      const environment = await getEnvironment(stage);
      return environment.put(key, value, description);
    } catch (err) {
      this.error(`Failed to set value for '${key}' in stage, ${stage}.`);
      return;
    }
  }
}
