/// <reference types="jest" />
import { SSM } from 'aws-sdk';
import { Environment } from '../../src/environment';

/** Type alias for `T` or `undefined`. */
type Nullable<T> = T | null;
/** Parameterized type alias for a callback that receives an error or a result. */
type CB<E extends Error, T> = (err: Nullable<E>, res: T) => void;

jest.mock('aws-sdk', () => {
  return {
    SSM: jest.fn(() => {
      return {
        addTagsToResource: jest.fn(),
        deleteParameters: jest.fn(
          (req: { Names: string[] }, cb: CB<Error, object>) => {
            const names = req.Names || [];
            cb(null, { DeletedParameters: names });
          }
        ),
        getParametersByPath: jest.fn((req: any, cb: CB<Error, object>) => {
          cb(null, {
            Parameters: [
              {
                Name: '/stage/foo',
                Type: 'String',
                Value: 'bar',
                Version: 1,
              },
            ],
          });
        }),
        putParameter: jest.fn(),
      };
    }),
  };
});

describe(Environment.validatePathPart, () => {
  it('throws when key is undefined', () => {
    expect.assertions(1);
    try {
      Environment.validatePathPart('Key');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('throws if key is empty', () => {
    expect.assertions(1);
    try {
      Environment.validatePathPart('Key', '');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('throws if key contains .', () => {
    expect.assertions(1);
    try {
      Environment.validatePathPart('Key', 'key.');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('throws if key contains /', () => {
    expect.assertions(1);
    try {
      Environment.validatePathPart('Key', 'key/');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('throws if key contains \\', () => {
    expect.assertions(1);
    try {
      Environment.validatePathPart('Key', 'key\\');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});

describe(Environment.validateRootPath, () => {
  it('succeeds if path is /', () => {
    Environment.validateRootPath('/');
  });
  it('throws if input does not start with /', () => {
    expect.assertions(1);
    try {
      Environment.validateRootPath('bin/');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('throws if input does not end with /', () => {
    expect.assertions(1);
    try {
      Environment.validateRootPath('/bin');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('throws if input does not have intermediate keys', () => {
    expect.assertions(1);
    try {
      Environment.validateRootPath('//');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
});

describe(Environment, () => {
  it('throws if fqnPrefix is empty', () => {
    expect.assertions(1);
    try {
      const env = new Environment('', new SSM());
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  describe('valid prefix', () => {
    const ssm = new SSM();
    const env = new Environment('/stage', ssm);
    it('creates an instance', () => {
      expect(env).toBeInstanceOf(Environment);
    });
    it('has variables', () => {
      expect(env.variables).toBeDefined();
    });
    it('has same number of variables as ssm.getParametersByPath', () => {
      expect(env.variables).toHaveLength(1);
    });
    it('has a foo', async () => {
      await expect(env.has('foo')).resolves.toBe(true);
    });
    it('has a foo EnvironmentVariable', async () => {
      const variable = await env.get('foo');
      expect(variable.value).toBe('bar');
    });
    it('will convert a foo EnvironmentVariable', async () => {
      const result = await env.getAs('foo', v => v.value === 'bar');
      expect(result).toBe(true);
    });
  });
});
