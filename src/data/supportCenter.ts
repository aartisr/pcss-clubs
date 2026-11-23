export const CLUB_SITE_REQUEST_EMAIL = 'pcss2robotics@pioneercss.org';

export interface SupportTopic {
  id: string;
  category: 'Discover' | 'Your account' | 'Club websites' | 'Corrections';
  question: string;
  answer: string;
}

export const SUPPORT_TOPICS: SupportTopic[] = [
  {
    id: 'find-club', category: 'Discover', question: 'How do I find a club at my campus?',
    answer: 'Start in the club directory. Search by name or interest, then use the campus and meeting-day filters to narrow the list. Open a club page to see the details currently available.',
  },
  {
    id: 'join-club', category: 'Discover', question: 'Does saving a club mean I joined it?',
    answer: 'No. Save for later creates a shortlist in this browser. To join or attend, contact the club or its advisor and confirm current meeting details.',
  },
  {
    id: 'sign-in', category: 'Your account', question: 'Why should I sign in?',
    answer: 'A school account opens your personal Pioneer space and lets you keep a club shortlist on this browser. Approved editors may also open the visual editor. Everyone can browse public pages without signing in.',
  },
  {
    id: 'another-account', category: 'Your account', question: 'How do I use a different school account?',
    answer: 'Open your account menu and choose Switch school account. Google will ask which account to use. Your current Pioneer Clubs account stays in place until another eligible school account finishes signing in. If you sign out first, the next sign-in also asks you to choose an account. Signing out here does not sign you out of Google or Chrome.',
  },
  {
    id: 'saved-clubs', category: 'Your account', question: 'Where did my saved clubs go?',
    answer: 'Your shortlist is stored in the browser where you saved it. It does not yet sync across devices or browsers. Sign in with the same school account and use the same browser to see it again.',
  },
  {
    id: 'sign-in-error', category: 'Your account', question: 'Google showed an error while I was signing in. What should I do?',
    answer: 'You can still browse the club directory and public pages without signing in. If Google says access is limited to the organization, go back to Pioneer Clubs and use a PCSS school account only if you want personal features. If Chrome just created a school profile, open the site in that profile before trying again. Start a fresh sign-in from the site; refreshing the old Google error URL will not restart it. If the error repeats with your school account, contact the portal team with the site address and approximate time. Do not send the full Google sign-in URL or any codes.',
  },
  {
    id: 'request-site', category: 'Club websites', question: 'Can our club or team have a website here?',
    answer: 'Yes, you can request a page after signing in. Share your club name, campus, and what the page should help students do. A request starts a review; it does not create or approve a public page automatically.',
  },
  {
    id: 'approval', category: 'Club websites', question: 'Does a request mean the school approved our club?',
    answer: 'No. A club website request is separate from school approval. Confirm your club’s standing, advisor, and permission to publish names, images, and meeting details through the school’s normal process.',
  },
  {
    id: 'edit-page', category: 'Club websites', question: 'Who can change a club page?',
    answer: 'Editing is limited to accounts given editor access. Changes made in the editor currently save only in that browser; they are not automatically published for everyone.',
  },
  {
    id: 'correction', category: 'Corrections', question: 'What if a listing or credit is wrong?',
    answer: 'Send the page link and the exact detail that needs review. Please avoid including private student information. For urgent school or safety matters, use the school’s official channels.',
  },
];

export interface ClubSiteRequestDraft {
  requesterName: string;
  requesterEmail: string;
  clubName: string;
  campusName: string;
  clubStatus: 'approved' | 'seeking-approval' | 'unsure';
  advisorName: string;
  purpose: string;
}

export function formatClubSiteRequestEmail(draft: ClubSiteRequestDraft, requestId: string): { subject: string; text: string } {
  const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();
  const status = {
    approved: 'Already approved by the school',
    'seeking-approval': 'Seeking school approval',
    unsure: 'Not sure yet',
  }[draft.clubStatus];
  const body = [
    'Hello Pioneer Clubs team,',
    '',
    'A school member has requested a club website for their team.',
    `Request reference: ${requestId}`,
    '',
    `Club or team: ${oneLine(draft.clubName)}`,
    `Campus: ${oneLine(draft.campusName)}`,
    `School approval status: ${status}`,
    `Advisor or mentor: ${oneLine(draft.advisorName) || 'Not provided'}`,
    '',
    'What the page should help students do:',
    draft.purpose.trim(),
    '',
    `Requested by: ${oneLine(draft.requesterName) || 'School member'} <${oneLine(draft.requesterEmail)}>`,
    '',
    'This request does not create or approve a public club page automatically. Details supplied by the requester have not been verified.',
  ].join('\n');
  return { subject: `Club website request: ${oneLine(draft.clubName)}`, text: body };
}
