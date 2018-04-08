import { Command, flags } from '@oclif/command';
import { parseTag, Tag, validateTag } from '../tag';

export interface WithTagFlag {
  tag: string[];
}

export const tagFlag = flags.string({
  char: 't',
  description: 'Tags to set on the variable as TagName:TagValue.',
  helpValue: 'TagName:TagValue',
  multiple: true,
  name: 'tag',
  parse: validateTag,
});
