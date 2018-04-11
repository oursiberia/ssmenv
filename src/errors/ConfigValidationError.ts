/**
 * An error intended to be throw when a potential project configuration object
 * is missing a required property.
 */
export class ConfigValidationError extends Error {
  constructor(key: string, fileName: string) {
    super(`${key} not in ${fileName}, please re-run init.`);
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ConfigValidationError.prototype);
  }
}
