import { args as Parser } from '@oclif/parser';

export interface Stage {
  stage: string;
}

export const stagePositional: Parser.IArg = {
  description: 'Stage to use for retrieving data. Appended to root path.',
  name: 'stage',
  required: true,
};
