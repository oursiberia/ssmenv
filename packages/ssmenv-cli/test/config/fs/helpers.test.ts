/// <reference types="jest" />
/// <reference types="node" />
import { ConfigFile } from '../../../src/config/fs/ConfigFile';
import { getAwsConfig, getProjectConfig } from '../../../src/config/fs/helpers';

describe(getAwsConfig, () => {
  it('creates a ConfigFile', () => {
    const config = getAwsConfig('fixtures');
    expect(config).toBeInstanceOf(ConfigFile);
    expect(config.fileName).toBe('fixtures/private.json');
  });
});

describe(getProjectConfig, () => {
  it('creates a ConfigFile', () => {
    const config = getProjectConfig('fixtures');
    expect(config).toBeInstanceOf(ConfigFile);
    expect(config.fileName).toBe('fixtures/public.json');
  });
});
