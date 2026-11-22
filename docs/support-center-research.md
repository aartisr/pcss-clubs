# Support Center research and design decisions

Researched November 22, 2026. These five references are official help or support pages, not templates to copy. Their products are much larger than this student-run portal, so the implementation keeps only what earns its space.

| Reference | Observed pattern | PCSS adaptation |
| --- | --- | --- |
| [Discord Help Center](https://support.discord.com/hc/en-us) and [request guide](https://support.discord.com/hc/en-us/articles/35714463749015-How-to-Submit-a-Support-Ticket-to-Discord) | Search-first help, topic categories, and a separate request path. Its request guide explains what information helps support and what happens after sending. | One search field filters short, plain-language answers. A distinct club website request section explains the handoff and review. |
| [Google for Education Help](https://support.google.com/edu/answer/9804057) | Routes people by the product or task they actually have, with self-service before contact. | Questions use real Pioneer tasks: finding clubs, school sign-in, saved clubs, editing, and corrections. |
| [GitHub Support](https://docs.github.com/en/support/contacting-github-support/creating-a-support-ticket) | Requests ask for enough context to act, and tickets remain reviewable afterward. GitHub explicitly separates feedback from troubleshooting. | The club request asks for the team, campus, approval stage, advisor if known, and page purpose. Site corrections have a separate contact path. The portal does not pretend to offer ticket tracking without a backend. |
| [Canva Help Center](https://www.canva.com/help/contact-us/) | Account-aware help tailors the contact path while leaving recovery routes available. | Public answers stay open; a signed-in school account unlocks a prepared club website request. If school sign-in is unavailable, a direct contact path remains visible. |
| [Slack Help Center](https://slack.com/help) and [Contact Us](https://join.slack.com/help/requests/new) | Topic-first choices and a human contact route appear together. Signed-in users can see support history where the service supports it. | The first screen offers three clear paths—explore, read answers, or request a website—without creating a fake chat bot or fake status history. |

## Design synthesis

1. **Start with intent.** The hero has a single search field and three immediate paths. Most answers can be found without signing in.
2. **Keep the language honest.** “Save for later” does not join a club. A website request does not approve a club or publish a page. A local Puck draft is not a shared published change.
3. **Ask for the minimum useful context.** School sign-in already provides the requester's name and email. The form asks for a club name, campus, approval stage, page purpose, and an optional advisor name. It does not ask for other students' contact details or photos.
4. **Make the handoff visible.** The selected delivery method is a prefilled email to `pcss2robotics@pioneercss.org`. “Open email draft” is the button label; the user must send it from their email app. The site never displays “request submitted” after merely opening the draft.
5. **Show a real review path.** The three-step panel describes preparation, sending, and review. It leaves the school's approval process with the school.
6. **Avoid unsupported promises.** There is no response-time guarantee, ticket number, AI assistant, or status tracker because this repository has no shared support database or email-sending service.

## Delivery and publishing boundaries

The public `/support` page is generated as route-specific HTML for direct visits and for visitors without JavaScript. Its interactive request form is available after sign-in. While `PUBLIC_CONTENT_VERIFIED` is false, the generated support route is marked `noindex` and is omitted from the sitemap. The support page is a student portal help resource; urgent safety and official school decisions go through PCSS channels.

If automatic email delivery is added later, it needs a school-approved sender, server-side authentication, delivery failure handling, privacy review, and an honest confirmation state. The current email-draft flow works without a server mail credential.
