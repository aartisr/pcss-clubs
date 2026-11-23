import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { getEmailSettings } from '../src/server/email/config.ts';

export function emailConfigIssues(env: NodeJS.ProcessEnv): string[] {
  if (!env.EMAIL_PROVIDER?.trim()) return [];
  try { return getEmailSettings(env) ? [] : ['Email provider is unavailable.']; }
  catch { return ['Email provider settings are invalid. Check EMAIL_PROVIDER, EMAIL_SENDER_EMAIL, the selected provider API key, and CLUB_SITE_REQUEST_RECIPIENT.']; }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = emailConfigIssues(process.env);
  if (issues.length) {
    issues.forEach((issue) => console.error(`Email preflight: ${issue}`));
    process.exitCode = 1;
  } else {
    console.log(process.env.EMAIL_PROVIDER ? 'Email provider preflight passed.' : 'Email provider preflight skipped; sending is disabled.');
  }
}
