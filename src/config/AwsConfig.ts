/**
 * Configuration necessary for connecting to AWS.
 */
export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
}

export type AwsProperty = keyof AwsConfig;

export const AwsRequiredProperties: AwsProperty[] = [
  'accessKeyId',
  'secretAccessKey',
];
