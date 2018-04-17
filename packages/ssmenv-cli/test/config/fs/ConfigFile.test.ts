/// <reference types="jest" />
/// <reference types="node" />
import { access, constants, unlink } from 'fs';
import { resolve } from 'path';
import {
  AwsConfig,
  AwsRequiredProperties,
} from '../../../src/config/AwsConfig';
import { ConfigFile } from '../../../src/config/fs/ConfigFile';
import {
  ProjectConfig,
  ProjectRequiredProperties,
} from '../../../src/config/ProjectConfig';
import { ConfigValidationError } from '../../../src/errors/index';

const FIXTURES = resolve(__dirname, '../../../', 'fixtures');

describe('ConfigFile<ProjectConfig>', () => {
  describe('valid', () => {
    const file = new ConfigFile<ProjectConfig>(
      `${FIXTURES}/project.json`,
      ProjectRequiredProperties
    );
    const fileConfig = require('../../../fixtures/project.json');
    describe('#partial', () => {
      it('reads rootPath', async () => {
        const config = await file.partial();
        expect(config.rootPath).toBe('/bin/');
      });
      it('reads stages', async () => {
        const config = await file.partial();
        expect(config.stages).toEqual(['development', 'production', 'staging']);
      });
    });
    describe('#read', () => {
      it('reads rootPath', async () => {
        const config = await file.read();
        expect(config.rootPath).toBe('/bin/');
      });
      it('reads stages', async () => {
        const config = await file.read();
        expect(config.stages).toEqual(['development', 'production', 'staging']);
      });
    });
    describe('#validate', () => {
      it('throws no errors', () => {
        file.validate(fileConfig);
      });
    });
  });
  describe('no stages', () => {
    const file = new ConfigFile<ProjectConfig>(
      `${FIXTURES}/project-nostages.json`,
      ProjectRequiredProperties
    );
    const fileConfig = require('../../../fixtures/project-nostages.json');
    describe('#partial', () => {
      it('reads rootPath', async () => {
        const config = await file.partial();
        expect(config.rootPath).toBe('/bin/');
      });
      it('has no stages', async () => {
        const config = await file.partial();
        expect(config.stages).toBeUndefined();
      });
    });
    describe('#read', () => {
      it('throws ConfigValidationError', async () => {
        expect.assertions(1);
        try {
          await file.read();
        } catch (err) {
          expect(err).toBeInstanceOf(ConfigValidationError);
        }
      });
    });
    describe('#validate', () => {
      it('throws ConfigValidationError', () => {
        expect.assertions(1);
        try {
          file.validate(fileConfig);
        } catch (err) {
          expect(err).toBeInstanceOf(ConfigValidationError);
        }
      });
    });
  });
  describe('no rootPath', () => {
    const file = new ConfigFile<ProjectConfig>(
      `${FIXTURES}/project-noroot.json`,
      ProjectRequiredProperties
    );
    const fileConfig = require('../../../fixtures/project-noroot.json');
    describe('#partial', () => {
      it('has no rootPath', async () => {
        const config = await file.partial();
        expect(config.rootPath).toBeUndefined();
      });
      it('has stages', async () => {
        const config = await file.partial();
        expect(config.stages).toEqual(['development', 'production', 'staging']);
      });
    });
    describe('#read', () => {
      it('throws ConfigValidationError', async () => {
        expect.assertions(1);
        try {
          await file.read();
        } catch (err) {
          expect(err).toBeInstanceOf(ConfigValidationError);
        }
      });
    });
    describe('#validate', () => {
      it('throws ConfigValidationError', () => {
        expect.assertions(1);
        try {
          file.validate(fileConfig);
        } catch (err) {
          expect(err).toBeInstanceOf(ConfigValidationError);
        }
      });
    });
  });
  describe('#write', () => {
    const fixture = `${FIXTURES}/project-write.json`;
    afterEach(done => {
      access(fixture, constants.W_OK, err => {
        if (err && err.code === 'ENOENT') {
          done();
        } else if (err) {
          throw err;
        } else {
          unlink(fixture, done);
        }
      });
    });
    const file = new ConfigFile<ProjectConfig>(
      fixture,
      ProjectRequiredProperties
    );
    it('writes successfully if valid', async () => {
      const fileConfig = require('../../../fixtures/project.json');
      await expect(file.write(fileConfig)).resolves.toMatch(fixture);
    });
    it('throws ConfigValidationError if no rootPath', async () => {
      const fileConfig = require('../../../fixtures/project-noroot.json');
      expect.assertions(1);
      try {
        await file.write(fileConfig);
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigValidationError);
      }
    });
    it('throws ConfigValidationError if no stages', async () => {
      const fileConfig = require('../../../fixtures/project-nostages.json');
      expect.assertions(1);
      try {
        await file.write(fileConfig);
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigValidationError);
      }
    });
  });
});

describe('ConfigFile<AwsConfig>', () => {
  describe('valid', () => {
    const file = new ConfigFile<AwsConfig>(
      `${FIXTURES}/aws.json`,
      AwsRequiredProperties
    );
    const fileConfig = require('../../../fixtures/aws.json');
    describe('#partial', () => {
      it('has accessKeyId', async () => {
        const config = await file.partial();
        expect(config.accessKeyId).toBe('foo');
      });
      it('has secretAccessKey', async () => {
        const config = await file.partial();
        expect(config.secretAccessKey).toBe('bar');
      });
    });
    describe('#read', () => {
      it('reads accessKeyId', async () => {
        const config = await file.partial();
        expect(config.accessKeyId).toBe('foo');
      });
      it('reads secretAccessKey', async () => {
        const config = await file.partial();
        expect(config.secretAccessKey).toBe('bar');
      });
    });
    describe('#validate', () => {
      it('throws no errors', () => {
        file.validate(fileConfig);
      });
    });
  });
  describe('no secretAccessKey', () => {
    const file = new ConfigFile<AwsConfig>(
      `${FIXTURES}/aws-nosecret.json`,
      AwsRequiredProperties
    );
    const fileConfig = require('../../../fixtures/aws-nosecret.json');
    describe('#partial', () => {
      it('has accessKeyId', async () => {
        const config = await file.partial();
        expect(config.accessKeyId).toBe('foo');
      });
      it('has no secretAccessKey', async () => {
        const config = await file.partial();
        expect(config.secretAccessKey).toBeUndefined();
      });
    });
    describe('#read', () => {
      it('throws ConfigValidationError', async () => {
        expect.assertions(1);
        try {
          await file.read();
        } catch (err) {
          expect(err).toBeInstanceOf(ConfigValidationError);
        }
      });
    });
    describe('#validate', () => {
      it('throws ConfigValidationError', () => {
        expect.assertions(1);
        try {
          file.validate(fileConfig);
        } catch (err) {
          expect(err).toBeInstanceOf(ConfigValidationError);
        }
      });
    });
  });
  describe('no accessKeyId', () => {
    const file = new ConfigFile<AwsConfig>(
      `${FIXTURES}/aws-noaccess.json`,
      AwsRequiredProperties
    );
    const fileConfig = require('../../../fixtures/aws-noaccess.json');
    describe('#partial', () => {
      it('has no accessKeyId', async () => {
        const config = await file.partial();
        expect(config.accessKeyId).toBeUndefined();
      });
      it('has secretAccessKey', async () => {
        const config = await file.partial();
        expect(config.secretAccessKey).toBe('bar');
      });
    });
    describe('#read', () => {
      it('throws ConfigValidationError', async () => {
        expect.assertions(1);
        try {
          await file.read();
        } catch (err) {
          expect(err).toBeInstanceOf(ConfigValidationError);
        }
      });
    });
    describe('#validate', () => {
      it('throws ConfigValidationError', () => {
        expect.assertions(1);
        try {
          file.validate(fileConfig);
        } catch (err) {
          expect(err).toBeInstanceOf(ConfigValidationError);
        }
      });
    });
  });
  describe('#write', () => {
    const fixture = `${FIXTURES}/aws-write.json`;
    afterEach(done => {
      access(fixture, constants.W_OK, err => {
        if (err && err.code === 'ENOENT') {
          done();
        } else if (err) {
          throw err;
        } else {
          unlink(fixture, done);
        }
      });
    });
    const file = new ConfigFile<AwsConfig>(fixture, AwsRequiredProperties);
    it('writes successfully if valid', async () => {
      const fileConfig = require('../../../fixtures/aws.json');
      await expect(file.write(fileConfig)).resolves.toMatch(fixture);
    });
    it('throws ConfigValidationError if no accessKeyId', async () => {
      const fileConfig = require('../../../fixtures/aws-noaccess.json');
      expect.assertions(1);
      try {
        await file.write(fileConfig);
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigValidationError);
      }
    });
    it('throws ConfigValidationError if no secretAccessKey', async () => {
      const fileConfig = require('../../../fixtures/aws-nosecret.json');
      expect.assertions(1);
      try {
        await file.write(fileConfig);
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigValidationError);
      }
    });
  });
});
