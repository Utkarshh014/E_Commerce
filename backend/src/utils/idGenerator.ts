import crypto from 'crypto';

/**
 * Generates a UUID v4 fallback without external dependencies.
 * Used for transaction IDs in mocked payment strategies.
 */
export function v4Fallback(): string {
  return crypto.randomUUID();
}
