import { args as Parser } from '@oclif/parser';

export interface Key {
  key: string;
}

export const keyPositional: Parser.IArg = {
  description: 'Key to use when setting the variable; AKA variable name.',
  name: 'key',
  required: true,
};
