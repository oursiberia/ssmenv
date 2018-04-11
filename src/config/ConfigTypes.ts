import { AwsConfig } from './AwsConfig';
import { ProjectConfig } from './ProjectConfig';

export type AnyConfig = AwsConfig | ProjectConfig;

export type ConfigProperty<T extends AnyConfig> = keyof T;

/**
 * Configuration combining AWS and project properties.
 */
export interface FullConfig extends AwsConfig, ProjectConfig {}
