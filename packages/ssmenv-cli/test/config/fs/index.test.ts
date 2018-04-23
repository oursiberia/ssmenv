/// <reference types="jest" />
/// <reference types="node" />
import { resolve } from 'path';
import { AwsSsmProxy, Environment } from 'ssmenv';
import { AwsRequiredProperties } from '../../../src/config/AwsConfig';
import { getEnvironment, readConfig } from '../../../src/config/fs/index';
import { ProjectRequiredProperties } from '../../../src/config/ProjectConfig';

jest.mock('aws-sdk', () => {
  return {
    SSM: jest.fn(() => {
      return {
        addTagsToResource: jest.fn(),
        deleteParameters: jest.fn(),
        getParametersByPath: jest.fn(),
        putParameter: jest.fn(),
      };
    }),
  };
});

const PROJECT_ROOT = resolve(__dirname, '../../../');

const validConfigPath = { pathToConfig: resolve(PROJECT_ROOT, 'fixtures') };
const invalidConfigPath = { pathToConfig: resolve(PROJECT_ROOT, 'nofixtures') };

describe(getEnvironment, () => {
  it('gets an instance with a valid path', async () => {
    const env = await getEnvironment('stage', validConfigPath);
    expect(env).toBeInstanceOf(Environment);
  });
  it('throws an error with invalid path', async () => {
    expect.assertions(1);
    await expect(
      getEnvironment('stage', invalidConfigPath)
    ).rejects.toBeDefined();
  });
});

describe(readConfig, () => {
  it('reads full config with valid path', async () => {
    const config = await readConfig(validConfigPath);
    expect.assertions(
      AwsRequiredProperties.length + ProjectRequiredProperties.length
    );
    AwsRequiredProperties.forEach(property => {
      expect(config).toHaveProperty(property);
    });
    ProjectRequiredProperties.forEach(property => {
      expect(config).toHaveProperty(property);
    });
  });
  it('throws an error with invalid path', async () => {
    expect.assertions(1);
    await expect(readConfig(invalidConfigPath)).rejects.toBeDefined();
  });
});
