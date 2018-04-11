import { Command, flags } from '@oclif/command';
import { args as Parser } from '@oclif/parser';

import { Key, keyPositional } from '../../arguments/key';
import { Stage, stagePositional } from '../../arguments/stage';
import { getEnvironment, pushStage } from '../../config/fs';
import { make as makeExample } from '../../example';
import { stageFlag, WithStageFlag } from '../../flags/stage';
import { tagFlag, WithTagFlag } from '../../flags/tag';
import { parseTag } from '../../tag';

interface Flags extends WithStageFlag, WithTagFlag {}

interface Args extends Key, Stage {}

export class VarSet extends Command {
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

  static args: Parser.IArg[] = [stagePositional, keyPositional];

  async run() {
    const { args, flags } = this.parse<Flags, Args>(VarSet);
    const { key, stage } = args;
    const stages = flags.stage;
    // Despite what the inferred signature of `flags` indicates `stage` can be undefined
    if (stages === undefined || stages.length === 0) {
      this.error('At least one stage is required for `var:del`.', { exit: 1 });
    }
    const results = await Promise.all(
      stages.map(stage => this.tag(stage, key, flags))
    );
    if (results.some(result => result === undefined)) {
      this.exit(1);
    }
  }

  private async tag(stage: string, key: string, flags: Flags) {
    try {
      await pushStage(stage);
    } catch (pushError) {
      this.error(`Book keeping - failed to save ${stage} to project config.`);
    }
    // Despite what the inferred signature of `flags` indicates `tag` can be undefined
    const tags = (flags.tag || []).map(parseTag);
    try {
      const environment = await getEnvironment(stage);
      return environment.tag(key, tags);
    } catch (err) {
      this.error(`Failed to set tags for '${key}' in stage, ${stage}.`);
    }
  }
}
