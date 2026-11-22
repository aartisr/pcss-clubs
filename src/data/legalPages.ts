import { STUDENT_WEB_ADMIN_CREDITS_PATH } from './credits';

export type LegalParagraph = string | { before: string; link: { label: string; href: string }; after: string };
export type LegalSection = { id: string; title: string; paragraphs: LegalParagraph[] };
export type LegalPage = { path: '/privacy' | '/terms'; title: string; summary: string; updated: string; sections: LegalSection[] };

export const PRIVACY_PAGE: LegalPage = {
  path: '/privacy',
  title: 'Privacy Policy',
  summary: 'What Pioneer Clubs uses to let you browse, sign in, and save clubs.',
  updated: 'November 22, 2026',
  sections: [
    { id: 'who', title: 'Who runs this site', paragraphs: [
      { before: 'Pioneer Clubs is a student-created club directory operated by the ', link: { label: 'Student Web Admin', href: STUDENT_WEB_ADMIN_CREDITS_PATH }, after: ' for the Pioneer Charter School of Science community. This policy covers pcssclubs.org and its club and campus pages. It is not a school student-records system.' },
    ] },
    { id: 'information', title: 'Information used by the site', paragraphs: [
      'You can browse public club pages without an account. When you choose school sign-in, Google authenticates you and sends the site a verified account identifier, name (if available), email address, and school-domain information. The site uses those details to recognize your session and decide whether you can use member or editor features.',
      'The site keeps your saved-club choices, theme preference, and any authorized editor drafts in your browser storage. Saved clubs are stored under a key based on your signed-in email. They are not a shared account record and do not follow you to another device.',
      'The club website request form prepares an email draft containing your signed-in name and email and the details you enter. The website does not send or store that request. If you send the draft, your email service and the recipient handle the message under their own practices.',
      'As with most websites, the hosting provider may process technical request information such as IP address, browser details, and requested pages to deliver and protect the site. The current app code does not add an advertising tracker or analytics service.',
    ] },
    { id: 'use', title: 'How information is used', paragraphs: [
      'Account details are used for sign-in, access control, and showing your account in the interface. Browser storage supports your saved clubs, appearance setting, and local editing work. Technical request information supports website delivery, reliability, and security. This site does not sell account information or use it for targeted advertising.',
    ] },
    { id: 'storage', title: 'Cookies, storage, and retention', paragraphs: [
      'Sign-in uses an encrypted, HttpOnly session cookie that expires after eight hours. A temporary sign-in cookie expires after five minutes. Signing out removes those cookies in your browser. The site does not keep a shared database of saved clubs or editor drafts; those items remain in browser storage until you remove them, reset them in the app, or clear browser data.',
      'The hosting provider may keep its own operational logs under its settings and retention practices. Google manages information used for Google sign-in under its own policies.',
    ] },
    { id: 'sharing', title: 'Other services and links', paragraphs: [
      'Google handles authentication. The hosting provider delivers the site. Fonts may be requested from Google Fonts. Club pages may link to external sites or email addresses; those destinations have their own privacy practices. Public club details can be read by anyone, so editors should publish only information they are authorized to share.',
    ] },
    { id: 'choices', title: 'Your choices', paragraphs: [
      'You may browse without signing in, sign out at any time, remove saved clubs in the app, and clear this site’s browser storage. To ask about an account detail or request correction or removal of a public listing, contact the student portal team through the Support Center linked below. For official student records, use the school’s established channels.',
    ] },
    { id: 'students', title: 'Students and younger visitors', paragraphs: [
      'Do not put private student information, personal contact details, or photos into club content without the permissions required by the school and applicable law. If you are under 13, use school sign-in only when the operator and your school or parent have confirmed that the required permissions and notices are in place. Public browsing does not require sign-in.',
    ] },
    { id: 'updates', title: 'Changes to this policy', paragraphs: [
      'This page will be updated when the site’s features or data practices change. The date above shows the latest version. Material changes should be reviewed before new data-collection features are enabled.',
    ] },
  ],
};

export const TERMS_PAGE: LegalPage = {
  path: '/terms',
  title: 'Terms of Use',
  summary: 'Ground rules for exploring and contributing to Pioneer Clubs.',
  updated: 'November 22, 2026',
  sections: [
    { id: 'about', title: 'About Pioneer Clubs', paragraphs: [
      'Pioneer Clubs is a student-created directory operated by Aarti S Ravikumar to help people discover clubs across Pioneer Charter School of Science campuses. These terms apply to your use of pcssclubs.org, its campus pages, and its club pages. The Privacy Policy explains how the site handles information.',
    ] },
    { id: 'information', title: 'Club information and school relationship', paragraphs: [
      'Club descriptions, schedules, meeting places, links, and contacts may be contributed or updated by students and can become inaccurate or out of date. A listing is not an official school notice, a promise that a club is active, or confirmation that an event is safe or approved. Check important details with the club advisor or the school before attending or relying on them.',
      'Naming a PCSS campus, club, or recognition does not mean that PCSS has reviewed or endorsed every page. PCSS is not responsible for independently authored club information solely because it appears on this student-run site. Nothing in these terms removes any duty or right that applicable law does not allow to be excluded.',
    ] },
    { id: 'accounts', title: 'School accounts and editing', paragraphs: [
      'Public pages are open to visitors. Member and editor tools require a school account and the appropriate permission. Keep your account secure, do not use another person’s account, and do not try to bypass access controls. An account from the school domain does not automatically grant editing rights.',
      'A request for a club website starts a review. It does not approve a club, authorize publication, or create a page automatically.',
    ] },
    { id: 'contributions', title: 'Contributing content', paragraphs: [
      'If you can edit a page, submit only information you reasonably believe is accurate and have permission to publish. Do not post private student records, personal phone numbers, sensitive details, or photos of people without the required permissions. Do not post harassing, discriminatory, unlawful, or infringing material. The operator may correct or remove content that is inaccurate, unsafe, or unsuitable for a school community.',
      'You keep any rights you have in your own contribution. By submitting content for publication, you permit the portal to display it as part of the club directory. Do not submit material you cannot authorize for that use.',
    ] },
    { id: 'availability', title: 'Availability and outside links', paragraphs: [
      'The site may change or be unavailable. External links lead to services with their own rules and policies. The portal does not control those destinations. No fee or club membership is created by browsing, saving, or viewing a listing.',
    ] },
    { id: 'limits', title: 'Accuracy and responsibility', paragraphs: [
      'The portal is provided as an informational resource. To the extent permitted by applicable law, the operator and contributors do not guarantee that every listing is complete, current, or error-free and are not responsible for decisions made solely from unverified listings. This does not limit rights or responsibilities that cannot lawfully be limited, including obligations concerning student privacy or safety.',
    ] },
    { id: 'changes', title: 'Changes and questions', paragraphs: [
      'These terms may change as the portal develops. The updated date above identifies the current version. For a correction, removal request, or question about these terms, contact the student portal team through the Support Center linked below. For official school decisions or emergencies, use PCSS’s official channels.',
    ] },
  ],
};
