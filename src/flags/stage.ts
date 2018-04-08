import { Command, flags } from '@oclif/command';
import { Environment } from '../environment';

function validateStage(param: string, context?: any) {
  Environment.validatePathPart('Stage', param);
  return param;
}

export interface WithStageFlag {
  stage: string[];
}

export const stageFlag = flags.string({
  char: 's',
  description: 'Tags to set on the variable as TagName:TagValue.',
  helpValue: 'stage',
  multiple: true,
  name: 'stage',
  parse: validateStage,
});
