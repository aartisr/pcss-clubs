import type { EmailMessage, EmailProvider } from './provider.js';
import { deliveryError, EmailDeliveryError } from './provider.js';

const RESEND_SEND_URL = 'https://api.resend.com/emails';

export class ResendEmailProvider implements EmailProvider {
  constructor(private readonly apiKey: string, private readonly fetcher: typeof fetch = fetch) {}

  async send(message: EmailMessage): Promise<{ messageId: string }> {
    let response: Response;
    try {
      response = await this.fetcher(RESEND_SEND_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': message.idempotencyKey,
        },
        body: JSON.stringify({
          from: `Pioneer Clubs <${message.from}>`,
          to: [message.to],
          reply_to: message.replyTo,
          subject: message.subject,
          text: message.text,
          tags: [{ name: 'category', value: 'club-site-request' }],
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch { throw new EmailDeliveryError('unavailable'); }
    if (!response.ok) throw await deliveryError(response);
    try {
      const result: unknown = await response.json();
      if (result && typeof result === 'object' && 'id' in result && typeof result.id === 'string' && result.id) return { messageId: result.id };
    } catch { /* Provider returned an unexpected response. */ }
    throw new EmailDeliveryError('unavailable', response.status, 'invalid_response');
  }
}
