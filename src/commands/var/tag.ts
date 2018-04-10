import { Command, flags } from '@oclif/command';
import { args as Parser } from '@oclif/parser';

import { Key, keyPositional } from '../../arguments/key';
import { Stage, stagePositional } from '../../arguments/stage';
import { getEnvironment } from '../../config/fs';
import { make as makeExample } from '../../example';
import { tagFlag, WithTagFlag } from '../../flags/tag';
import { parseTag } from '../../tag';

interface Flags extends WithTagFlag {} // tslint:disable-line no-empty-interface

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
    tag: tagFlag,
  };

  static args: Parser.IArg[] = [stagePositional, keyPositional];

  async run() {
    const { args, flags } = this.parse<Flags, Args>(VarSet);
    const { key, stage } = args;
    // Despite what the inferred signature of `flags` indicates `tag` can be undefined
    const tags = (flags.tag || []).map(parseTag);
    const environment = await getEnvironment(stage);
    const result = await environment.tag(key, tags);
  }
}
