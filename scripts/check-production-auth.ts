import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { getAuthConfig } from '../src/server/auth.ts';

const required = ['OIDC_ISSUER', 'OIDC_CLIENT_ID', 'OIDC_CLIENT_SECRET', 'OIDC_APP_ORIGIN', 'OIDC_SESSION_SECRET'] as const;

/** Fail a production build before it can publish a site with an unusable sign-in control. */
export function productionAuthIssues(env: NodeJS.ProcessEnv): string[] {
  if (env.VERCEL_ENV !== 'production') return [];
  const missing = required.filter((name) => !env[name]?.trim());
  if (missing.length) return [`Missing Production environment variables: ${missing.join(', ')}.`];
  try {
    const config = getAuthConfig(env);
    if (!config || !config.origin.startsWith('https://')) return ['OIDC_APP_ORIGIN must be the HTTPS production site origin.'];
  } catch {
    return ['Production OIDC settings are invalid. Check the issuer, app origin, session secret, and authentication method.'];
  }
  return [];
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = productionAuthIssues(process.env);
  if (issues.length) {
    for (const issue of issues) console.error(`Sign-in preflight: ${issue}`);
    process.exitCode = 1;
  } else {
    console.log(process.env.VERCEL_ENV === 'production' ? 'Production sign-in preflight passed.' : 'Production sign-in preflight skipped outside Vercel Production.');
  }
}
