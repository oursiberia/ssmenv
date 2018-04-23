import { Command } from '@oclif/command';
import { Environment } from 'ssmenv';

import { getAwsConfig } from '../../config/fs/helpers';
import { make as makeExample } from '../../example';

export class EnvList extends Command {
  static description = [
    'List the known stages or environments, ignoring configured `rootPath`.',
    'A stage or environment is considered any path with a direct child path holding a value.',
  ].join('\n');

  static examples = [
    makeExample([
      `# List out the full paths to all known stages.`,
      `$ ssmenv env:list`,
      `/client/project/dev`,
      `/client/project/production`,
      `/client/project/test`,
      `/otherclient/test_project/production`,
      `/otherproject/dev`,
    ]),
  ];

  async run() {
    const configFile = await getAwsConfig();
    const awsConfig = await configFile.read();
    const instanceConfig = {
      accessKeyId: awsConfig.accessKeyId,
      apiVersion: '2014-11-06',
      region: 'us-east-1',
      secretAccessKey: awsConfig.secretAccessKey,
    };
    const results: string[] = await Environment.listAll(instanceConfig);
    results.forEach(path => this.log(path));
  }
}
