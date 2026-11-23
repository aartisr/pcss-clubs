import { useCallback, useEffect, useRef, useState } from 'react';

export interface ClubSiteRequestInput {
  clubName: string;
  campusSlug: string;
  clubStatus: 'approved' | 'seeking-approval' | 'unsure';
  advisorName: string;
  purpose: string;
}

const messages: Record<string, string> = {
  INVALID_REQUEST: 'Check the club name, campus, and purpose, then try again.',
  SIGN_IN_REQUIRED: 'Your school sign-in has ended. Sign in again to send this request.',
  INVALID_ORIGIN: 'This page has moved to another site address. Reload the page and try again.',
  EMAIL_LIMIT_REACHED: 'The email service has reached a limit. Your request was not sent. Please try again later; your answers will stay here.',
  EMAIL_UNAVAILABLE: 'We could not confirm that your request was sent. Your answers are still here; please try again later.',
  SIGN_IN_UNAVAILABLE: 'School sign-in is temporarily unavailable. Your request was not sent.',
};

export function useClubSiteRequest() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [availability, setAvailability] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const attempt = useRef<{ fingerprint: string; submissionId: string } | null>(null);

  const checkAvailability = useCallback(async () => {
    setAvailability('checking');
    try {
      const response = await fetch('/api/club-site-requests', { cache: 'no-store' });
      const result = await response.json();
      setAvailability(response.ok && result?.available === true ? 'available' : 'unavailable');
    } catch { setAvailability('unavailable'); }
  }, []);
  useEffect(() => { void checkAvailability(); }, [checkAvailability]);

  const submit = async (input: ClubSiteRequestInput): Promise<void> => {
    if (pending || reference || availability !== 'available') return;
    setPending(true);
    setError('');
    const fingerprint = JSON.stringify(input);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, submissionId: crypto.randomUUID() };
    try {
      const response = await fetch('/api/club-site-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ...input, submissionId: attempt.current.submissionId }),
      });
      const result: unknown = await response.json().catch(() => null);
      const data = result && typeof result === 'object' ? result as Record<string, unknown> : {};
      if (response.status === 202 && typeof data.requestId === 'string' && data.notificationStatus === 'accepted') {
        setReference(data.requestId);
      } else {
        setError(messages[String(data.code)] || 'Your request was not sent. Please try again.');
      }
    } catch {
      setError('We could not reach the email service. Your answers are still here; please try again.');
    } finally {
      setPending(false);
    }
  };

  const reset = () => { setReference(''); setError(''); attempt.current = null; };
  return { pending, error, reference, availability, checkAvailability, submit, reset };
}
