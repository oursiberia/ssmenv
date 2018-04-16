import { SSM } from 'aws-sdk';
import { EnvironmentVariable } from './EnvironmentVariable';

/** Type alias for a function converting a string to another, parameterized type. */
export type Convert<T> = (value: EnvironmentVariable) => T;
/** string alias for fully qualified parameter name. */
export type FQN = string;
/** string alias for parameter name (not fully qualified). */
export type Key = string;
/** Type alias for a parameterized type that may be undefined. */
export type Option<T> = T | undefined;
/** Type alias for `AWS.SSM.ParamterHistory`. */
export type Parameter = SSM.ParameterHistory;
