/* tslint:disable no-empty-interface */
import * as AWS from 'aws-sdk';

/** Alias for `AWS.SSM.Tag`. */
export interface Tag extends AWS.SSM.Tag {}

/**
 * Validate `param` can be parsed into a `Tag`.
 * @param param to validate.
 * @param context ???
 * @returns `param` unmodified if it can be parsed.
 * @throws Error if it can't be parsed.
 */
export function validateTag(param: string, context?: any) {
  const [key, value, ...rest] = param.split(':');
  if (rest.length !== 0) {
    throw new Error(`Too many parts divided by ':' in '${param}'.`);
  } else if (value === undefined) {
    throw new Error(`value could not be parsed from '${param}'.`);
  } else if (key === undefined) {
    throw new Error(`key could not be parsed from '${param}'.`);
  }
  return param;
}

/**
 * Parse a string into an AWS Tag, splitting on ':'.
 * @param param to split.
 * @returns an object that conforms to the tag interface.
 */
export function parseTag(param: string): Tag {
  const [key, value, ...rest] = validateTag(param).split(':');
  return {
    Key: key,
    Value: value,
  };
}
