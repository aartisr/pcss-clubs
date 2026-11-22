export type AuthIssue = 'origin' | 'service' | 'network' | 'invalid' | null;

export function sessionFailureKind(status: number, detail: unknown): Exclude<AuthIssue, null> {
  if (status === 400 && detail && typeof detail === 'object' &&
    (('code' in detail && detail.code === 'ORIGIN_MISMATCH') ||
      ('error' in detail && detail.error === 'Invalid application origin.'))) return 'origin';
  return 'service';
}
