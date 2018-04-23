import { flags } from '@oclif/command'; // tslint:disable-line no-unused-variable
import { args as Parser } from '@oclif/parser';
import { EnvironmentVariable } from 'ssmenv';

import { Key, keyPositional } from '../../arguments/key';
import { StageActorCommand } from '../../command/StageActorCommand';
import { getEnvironment } from '../../config/fs';
import { make as makeExample } from '../../example';
import { stageFlag, WithStageFlag } from '../../flags/stage';
import { tagFlag, WithTagFlag } from '../../flags/tag';
import { parseTag } from '../../tag';

export interface Flags extends WithStageFlag, WithTagFlag {}

// tslint:disable-next-line no-empty-interface
export interface Args extends Key {}

export class VarTag extends StageActorCommand<
  Args,
  Flags,
  EnvironmentVariable
> {
  static description = 'Add tags to a variable. Variable must exist.';

  static examples = [
    makeExample([
      `# Set Client tag of FOO variable in test stage.`,
      `$ ssmenv var:set test FOO --tag=Client:baz`,
    ]),
    makeExample([
      `# Set multiple tags on FOO variable for staging.`,
      `$ ssmenv var:set staging FOO --tag=Client:baz --tag=Environment:staging`,
    ]),
  ];

  static flags = {
    stage: stageFlag,
    tag: tagFlag,
  };

  static args: Parser.IArg[] = [keyPositional];

  async runOnStage(stage: string, args: Args, flags: Flags) {
    const { key } = args;
    // Despite what the inferred signature of `flags` indicates `tag` can be undefined
    const tags = (flags.tag || []).map(parseTag);
    try {
      const environment = await getEnvironment(stage);
      return environment.tag(key, tags);
    } catch (err) {
      this.error(`Failed to set tags for '${key}' in stage, ${stage}.`);
      return;
    }
  }
}
