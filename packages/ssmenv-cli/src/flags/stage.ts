import { flags } from '@oclif/command';
import { Environment } from 'ssmenv';

function validateStage(param: string, context?: any) {
  Environment.validatePathPart('Stage', param);
  return param;
}

export interface WithStageFlag {
  stage: string[];
}

export const stageFlag = flags.string({
  char: 's',
  description: 'Stage to operate within. May be provided multiple times.',
  helpValue: 'stage',
  multiple: true,
  name: 'stage',
  parse: validateStage,
});
