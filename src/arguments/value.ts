import { args as Parser } from '@oclif/parser';

export interface Value {
  value: string;
}

export const valuePositional: Parser.IArg = {
  description: 'Value of the variable to set.',
  name: 'value',
  required: true,
};
