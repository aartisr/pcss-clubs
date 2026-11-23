import type { EmailMessage, EmailProvider } from './provider.js';
import { deliveryError, EmailDeliveryError } from './provider.js';

const BREVO_SEND_URL = 'https://api.brevo.com/v3/smtp/email';

export class BrevoEmailProvider implements EmailProvider {
  constructor(private readonly apiKey: string, private readonly fetcher: typeof fetch = fetch) {}

  async send(message: EmailMessage): Promise<{ messageId: string }> {
    let response: Response;
    try {
      response = await this.fetcher(BREVO_SEND_URL, {
        method: 'POST',
        headers: { 'api-key': this.apiKey, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Pioneer Clubs', email: message.from },
          to: [{ email: message.to }],
          replyTo: { email: message.replyTo },
          subject: message.subject,
          textContent: message.text,
          headers: { IdempotencyKey: message.idempotencyKey },
          tags: ['club-site-request'],
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new EmailDeliveryError('unavailable');
    }
    if (!response.ok) throw await deliveryError(response);
    try {
      const result: unknown = await response.json();
      if (result && typeof result === 'object' && 'messageId' in result && typeof result.messageId === 'string' && result.messageId) {
        return { messageId: result.messageId };
      }
    } catch { /* Brevo did not return its documented message ID. */ }
    throw new EmailDeliveryError('unavailable');
  }
}
