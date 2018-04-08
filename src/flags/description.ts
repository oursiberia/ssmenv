import { Command, flags } from '@oclif/command';

export interface WithDescriptionFlag {
  description?: string;
}

export const descriptionFlag = flags.string({
  char: 'd',
  description: 'Description of the variable.',
  name: 'description',
});
