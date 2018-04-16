/// <reference types="jest" />
import { parseTag, validateTag } from '../src/tag';

describe(parseTag, () => {
  it('throws without colons', () => {
    expect.assertions(1);
    try {
      const tag = parseTag('nocolon');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('throws with multiple colons', () => {
    expect.assertions(1);
    try {
      const tag = parseTag('no:col:on');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('throws with nothing after colon', () => {
    expect.assertions(1);
    try {
      const tag = parseTag('col:');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('throws with nothing before colon', () => {
    expect.assertions(1);
    try {
      const tag = parseTag(':on');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('generates a tag', () => {
    const tag = parseTag('my:tag');
    expect(tag).toBeDefined();
  });
  it('generates a tag with key', () => {
    const tag = parseTag('my:tag');
    expect(tag.Key).toBeDefined();
    expect(tag.Key).toBe('my');
  });
  it('generates a tag with value', () => {
    const tag = parseTag('my:tag');
    expect(tag.Value).toBeDefined();
    expect(tag.Value).toBe('tag');
  });
});

describe(validateTag, () => {
  it('throws without colons', () => {
    expect.assertions(1);
    try {
      const tag = validateTag('nocolon');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('throws with multiple colons', () => {
    expect.assertions(1);
    try {
      const tag = validateTag('no:col:on');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('throws with nothing after colon', () => {
    expect.assertions(1);
    try {
      const tag = validateTag('col:');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('throws with nothing before colon', () => {
    expect.assertions(1);
    try {
      const tag = validateTag(':on');
    } catch (err) {
      expect(err).toBeDefined();
    }
  });
  it('is identity when valid', () => {
    const tag = validateTag('my:tag');
    expect(tag).toBeDefined();
    expect(tag).toBe('my:tag');
  });
});
