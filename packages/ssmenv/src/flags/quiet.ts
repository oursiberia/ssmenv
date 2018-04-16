import { flags } from '@oclif/command';

export interface WithQuietFlag {
  quiet: boolean;
}

export const quietFlag = flags.boolean({
  char: 'q',
  description: 'Suppress informative but unnecessary output.',
  name: 'quiet',
});
