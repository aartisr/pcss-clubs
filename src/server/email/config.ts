import { BrevoEmailProvider } from './brevo.js';
import { ResendEmailProvider } from './resend.js';
import type { EmailProvider } from './provider.js';
import { CLUB_SITE_REQUEST_EMAIL } from '../../data/supportCenter.js';

const emailAddress = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export interface EmailSettings {
  providerName: string;
  provider: EmailProvider;
  sender: string;
  recipient: string;
}

export function getEmailSettings(env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch): EmailSettings | null {
  const selection = env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (!selection) return null;
  const factories: Record<string, () => EmailProvider> = {
    brevo: () => new BrevoEmailProvider(env.BREVO_API_KEY!.trim(), fetcher),
    resend: () => new ResendEmailProvider(env.RESEND_API_KEY!.trim(), fetcher),
  };
  if (!Object.hasOwn(factories, selection)) throw new Error('Unsupported email provider.');
  const apiKey = selection === 'brevo' ? env.BREVO_API_KEY?.trim() : env.RESEND_API_KEY?.trim();
  const sender = env.EMAIL_SENDER_EMAIL?.trim() || (selection === 'brevo' ? env.BREVO_SENDER_EMAIL?.trim() : undefined);
  const recipient = env.CLUB_SITE_REQUEST_RECIPIENT?.trim() || CLUB_SITE_REQUEST_EMAIL;
  if (!apiKey || !sender || !emailAddress.test(sender) || !emailAddress.test(recipient)) throw new Error('Email delivery is not configured.');
  return { providerName: selection, provider: factories[selection](), sender, recipient };
}
