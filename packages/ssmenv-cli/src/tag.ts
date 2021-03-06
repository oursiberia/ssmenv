import { Tag } from 'ssmenv';

/**
 * Validate `param` can be parsed into a `Tag`.
 * @param param to validate.
 * @returns `param` unmodified if it can be parsed.
 * @throws Error if it can't be parsed.
 */
export function validateTag(param: string) {
  const [key, value, ...rest] = param.split(':');
  if (rest.length !== 0) {
    throw new Error(`Too many parts divided by ':' in '${param}'.`);
  } else if (value === undefined || value === '') {
    throw new Error(`value could not be parsed from '${param}'.`);
  } else if (key === undefined || key === '') {
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
  const [key, value] = validateTag(param).split(':');
  return {
    Key: key,
    Value: value,
  };
}
