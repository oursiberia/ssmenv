import { Tag } from './Tag';
import { FQN, Key } from './Types';

/**
 * Structure of an environment variable.
 */
export interface EnvironmentVariable {
  /** Description applied to the environment variable. */
  description?: string;
  /** Full path of the parameter. */
  path: FQN;
  /** Path of the parameter without environemnt path. */
  key: Key;
  /** Tags applied to the parameter. */
  tags?: Tag[];
  /** Value of the parameter. */
  value: string;
  /** Version of the parameter. */
  version?: number;
}
