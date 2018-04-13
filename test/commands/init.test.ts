/// <reference types="jest" />
import { IConfig } from '@oclif/config';
import { Init } from '../../src/commands/init';

describe(Init.isValidPathPart, () => {
  it('returns error if key is empty', () => {
    const err = Init.isValidPathPart('');
    expect(err).toMatch('Stage is not valid,');
  });
  it('returns error if key contains .', () => {
    const err = Init.isValidPathPart('key.');
    expect(err).toMatch('Stage is not valid,');
  });
  it('returns error if key contains /', () => {
    const err = Init.isValidPathPart('key/');
    expect(err).toMatch('Stage is not valid,');
  });
  it('returns error if key contains \\', () => {
    const err = Init.isValidPathPart('key\\');
    expect(err).toMatch('Stage is not valid,');
  });
  it('returns true for valid path part', () => {
    expect(Init.isValidPathPart('valId_kEy-Here1')).toBe(true);
  });
});

describe(Init.isValidPathParts, () => {
  it('returns error if any key is empty', () => {
    const err = Init.isValidPathParts('valId_kEy-Here1,');
    expect(err).toMatch('Stage is not valid,');
  });
  it('returns error if any key contains .', () => {
    const err = Init.isValidPathParts('valId_kEy-Here1,key.');
    expect(err).toMatch('Stage is not valid,');
  });
  it('returns error if any key contains /', () => {
    const err = Init.isValidPathParts('valId_kEy-Here1,key/');
    expect(err).toMatch('Stage is not valid,');
  });
  it('returns error if any key contains \\', () => {
    const err = Init.isValidPathParts('valId_kEy-Here1,key\\');
    expect(err).toMatch('Stage is not valid,');
  });
  it('returns true for valid path part', () => {
    expect(Init.isValidPathParts('valId_kEy-Here1,valId_kEy-Here1')).toBe(true);
  });
});

describe(Init.isValidRootPath, () => {
  it('returns true if path is /', () => {
    expect(Init.isValidRootPath('/')).toBe(true);
  });
  it('returns true if path has valid parts', () => {
    expect(Init.isValidRootPath('/valId_kEy-Here1/')).toBe(true);
  });
  it('returns error if input does not start with /', () => {
    expect(Init.isValidRootPath('bin/')).toMatch("start with '/'");
  });
  it('returns error if input does not end with /', () => {
    expect(Init.isValidRootPath('/bin')).toMatch("end with '/'");
  });
  it('returns error if input does not have intermediate keys', () => {
    expect(Init.isValidRootPath('//')).toMatch('not have empty intermediate');
  });
});
