/// <reference types="jest" />
/// <reference types="node" />
import { AwsRequiredProperties } from '../../../src/config/AwsConfig';
import {
  getDirectEnvironment,
  getEnvironment,
  readConfig,
} from '../../../src/config/fs/index';
import { ProjectRequiredProperties } from '../../../src/config/ProjectConfig';
import { Environment } from '../../../src/environment';
import { AwsSsmProxy } from '../../../src/environment/AwsSsmProxy';

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

const validConfigPath = { pathToConfig: 'fixtures' };
const invalidConfigPath = { pathToConfig: 'nofixtures' };

describe(getDirectEnvironment, () => {
  it('gets an instance with valid path', async () => {
    const ssm = await getDirectEnvironment(validConfigPath);
    expect(ssm).toBeInstanceOf(AwsSsmProxy);
  });
  it('throws an error with invalid path', async () => {
    expect.assertions(1);
    await expect(getDirectEnvironment(invalidConfigPath)).rejects.toBeDefined();
  });
});

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
