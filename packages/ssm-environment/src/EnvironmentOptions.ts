/**
 * Options available when creating an `Environment` instance.
 */
export interface EnvironmentOptions {
  /** Whether or not we should attempt to decrypt SecureString values. */
  withDecryption?: boolean;
  /** The key to use when encrypting values. */
  withEncryption?: string;
}
