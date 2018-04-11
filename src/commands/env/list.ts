import { Command } from '@oclif/command';
import { args as Parser } from '@oclif/parser';

import { getDirectEnvironment } from '../../config/fs';
import { AwsSsmProxy } from '../../environment/AwsSsmProxy';
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
    const proxy = await getDirectEnvironment();
    const request = {
      Path: '/',
      Recursive: true,
    };
    const results = await proxy.getParametersByPath(request);
    const parameters = results.Parameters || [];
    parameters
      .map(param => {
        const lastSlash = param.Name!.lastIndexOf('/');
        return param.Name!.slice(0, lastSlash);
      })
      .reduce((paths: string[], next: string) => {
        if (paths.includes(next)) {
          return paths;
        } else {
          return [...paths, next];
        }
      }, [])
      .sort()
      .forEach(path => this.log(path));
  }
}
