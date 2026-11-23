import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, ChevronDown, Compass, Mail, Search, Send, UsersRound } from 'lucide-react';
import { SiteShell } from '../components/SiteShell';
import { useAuth } from '../context/AuthContext';
import { useRegistry } from '../context/RegistryContext';
import { PUBLIC_CONTENT_VERIFIED } from '../data/publication';
import { CLUB_SITE_REQUEST_EMAIL, SUPPORT_TOPICS } from '../data/supportCenter';
import { useClubSiteRequest, type ClubSiteRequestInput } from '../hooks/useClubSiteRequest';
import { usePageMetadata } from '../hooks/usePageMetadata';
import { AUTH_COPY } from '../data/authCopy';

const helpEmail = `mailto:${CLUB_SITE_REQUEST_EMAIL}?subject=${encodeURIComponent('Pioneer Clubs support question')}`;

export function SupportPage() {
  const auth = useAuth();
  const { campuses } = useRegistry();
  const [query, setQuery] = useState('');
  const [clubName, setClubName] = useState('');
  const [campusSlug, setCampusSlug] = useState('');
  const [clubStatus, setClubStatus] = useState<ClubSiteRequestInput['clubStatus']>('unsure');
  const [advisorName, setAdvisorName] = useState('');
  const [purpose, setPurpose] = useState('');
  const request = useClubSiteRequest();
  const [formError, setFormError] = useState('');
  const search = query.trim().toLowerCase();
  const filteredTopics = useMemo(() => SUPPORT_TOPICS.filter((topic) => !search || `${topic.category} ${topic.question} ${topic.answer}`.toLowerCase().includes(search)), [search]);
  const signedInWithEmail = auth.capabilities.requestClubSite && Boolean(auth.user?.email);

  usePageMetadata({
    title: 'Support Center | Pioneer Clubs',
    description: 'Find help with Pioneer Clubs, correct a listing, and request a website for your club or team.',
    canonicalPath: '/support',
    indexable: PUBLIC_CONTENT_VERIFIED,
  });

  const submitRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signedInWithEmail || request.pending || request.reference) return;
    if (!clubName.trim() || !purpose.trim()) {
      setFormError('Add your club name and what the page should help students do.');
      return;
    }
    const campus = campuses.find((item) => item.slug === campusSlug);
    if (!campus) {
      setFormError('Choose your campus to continue.');
      return;
    }
    setFormError('');
    void request.submit({ clubName, campusSlug, clubStatus, advisorName, purpose });
  };

  return (
    <SiteShell>
      <main className="flex-1">
        <section className="site-hero bg-[#0B2240] text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,0.6fr)] lg:items-center lg:py-24">
            <div>
              <p className="site-kicker text-xs font-bold text-[#F7D46B]">Pioneer Clubs · Support Center</p>
              <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">A clearer path to your next step.</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">Find a quick answer, tell us what needs fixing, or start a club website request for your team.</p>
              <label htmlFor="support-search" className="mt-8 block max-w-xl">
                <span className="sr-only">Search support topics</span>
                <span className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white px-4 py-3.5 text-[#0B2240] shadow-xl shadow-black/10">
                  <Search className="h-5 w-5 shrink-0 text-[#8B1E24]" aria-hidden="true" />
                  <input id="support-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions about clubs, accounts, or pages" className="min-w-0 w-full bg-transparent text-sm placeholder:text-[#64748B] focus:outline-none" />
                </span>
              </label>
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm sm:p-8">
              <p className="site-kicker text-xs font-bold text-[#F7D46B]">Start here</p>
              <div className="mt-5 space-y-4 text-sm">
                <Link to="/" className="group flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 p-3 hover:bg-white/10"><Compass className="h-5 w-5 shrink-0 text-[#F7D46B]" aria-hidden="true" /><span className="flex-1">Explore the club directory</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>
                <a href="#questions" className="group flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 p-3 hover:bg-white/10"><BookOpen className="h-5 w-5 shrink-0 text-[#F7D46B]" aria-hidden="true" /><span className="flex-1">Read common answers</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></a>
                <a href="#request-club-site" className="group flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 p-3 hover:bg-white/10"><UsersRound className="h-5 w-5 shrink-0 text-[#F7D46B]" aria-hidden="true" /><span className="flex-1">Request a club website</span><ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></a>
              </div>
            </div>
          </div>
        </section>

        <section id="questions" aria-labelledby="questions-heading" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-3xl">
            <p className="site-kicker text-xs font-bold text-[#8B1E24] dark:text-[#FCA5A5]">Find your answer</p>
            <h2 id="questions-heading" className="mt-3 font-display text-3xl font-bold text-[#0B2240] dark:text-white sm:text-4xl">The essentials, in plain language.</h2>
            <p className="mt-3 text-sm leading-7 text-[#475569] dark:text-slate-300">These answers describe what the portal can do today.</p>
          </div>
          <p role="status" className="mt-8 text-xs font-semibold text-[#64748B] dark:text-slate-300">{search ? `${filteredTopics.length} ${filteredTopics.length === 1 ? 'answer' : 'answers'} found` : 'Popular questions'}</p>
          {filteredTopics.length ? <div className="mt-3 grid items-start gap-4 md:grid-cols-2">
            {filteredTopics.map((topic) => <details key={topic.id} className="site-card group rounded-2xl border border-[#E2E8F0] bg-white p-5 open:border-[#D4AF37]/70 dark:border-[#1E3A5F] dark:bg-[#0E1C33] sm:p-6">
              <summary className="relative cursor-pointer list-none pr-7 font-display text-base font-bold text-[#0B2240] marker:hidden dark:text-white"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.13em] text-[#8B1E24] dark:text-[#FCA5A5]">{topic.category}</span>{topic.question}<ChevronDown className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
              <p className="mt-4 border-t border-[#E2E8F0] pt-4 text-sm leading-7 text-[#475569] dark:border-[#1E3A5F] dark:text-slate-300">{topic.answer}</p>
            </details>)}
          </div> : <div className="site-card mt-3 rounded-2xl border border-[#E2E8F0] bg-white p-6 dark:border-[#1E3A5F] dark:bg-[#0E1C33]"><p className="font-semibold text-[#0B2240] dark:text-white">No answer matched that search.</p><p className="mt-1 text-sm text-[#475569] dark:text-slate-300">Try “club”, “account”, or “website”, or contact the student portal team below.</p><button type="button" onClick={() => setQuery('')} className="mt-4 text-sm font-semibold text-[#8B1E24] underline dark:text-[#FCA5A5]">Clear search</button></div>}
        </section>

        <section id="request-club-site" aria-labelledby="request-heading" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="site-card overflow-hidden rounded-3xl border border-[#D6E0EA] bg-white dark:border-[#1E3A5F] dark:bg-[#0E1C33]">
            <div className="grid lg:grid-cols-[minmax(250px,0.8fr)_minmax(0,1.2fr)]">
              <div className="site-hero bg-[#0B2240] p-7 text-white sm:p-10">
                <p className="site-kicker text-xs font-bold text-[#F7D46B]">For student teams</p>
                <h2 id="request-heading" className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">Give your club a place to grow.</h2>
                <p className="mt-4 text-sm leading-7 text-slate-200">Tell us what your team needs. We’ll use your school account email to connect your request with you.</p>
                <ol className="mt-8 space-y-4 text-sm text-slate-200">
                  <li className="flex gap-3"><span className="font-mono font-bold text-[#F7D46B]">01</span><span>Share your club and campus.</span></li>
                  <li className="flex gap-3"><span className="font-mono font-bold text-[#F7D46B]">02</span><span>Send your request here. No email app needed.</span></li>
                  <li className="flex gap-3"><span className="font-mono font-bold text-[#F7D46B]">03</span><span>The team reviews details and any needed school approvals before a public page is made.</span></li>
                </ol>
              </div>
              <div className="p-6 sm:p-10">
                {auth.status === 'loading' ? <p className="text-sm text-[#475569] dark:text-slate-300">Checking your school account…</p> : signedInWithEmail ? request.availability === 'checking' ? <p role="status" className="text-sm text-[#475569] dark:text-slate-300">Checking request service…</p> : request.availability === 'unavailable' ? <div className="max-w-lg py-8"><h3 className="font-display text-xl font-bold text-[#0B2240] dark:text-white">Requests are temporarily unavailable</h3><p className="mt-3 text-sm leading-7 text-[#475569] dark:text-slate-300">The portal team needs to finish email setup or restore the request service. You can still browse clubs and support answers.</p><button type="button" onClick={() => void request.checkAvailability()} className="mt-5 rounded-xl bg-[#8B1E24] px-5 py-3 text-sm font-bold text-white">Check again</button></div> : request.reference ? <div role="status" className="max-w-lg py-8"><CheckCircle2 className="h-9 w-9 text-[#8B1E24] dark:text-[#FCA5A5]" aria-hidden="true" /><h3 className="mt-4 font-display text-2xl font-bold text-[#0B2240] dark:text-white">Request passed to the email service</h3><p className="mt-3 text-sm leading-7 text-[#475569] dark:text-slate-300">Reference {request.reference}. The team can review it when the email arrives. Delivery may be delayed if the service has reached its daily limit. This request does not approve or publish a club page.</p><button type="button" onClick={() => { request.reset(); setClubName(''); setCampusSlug(''); setClubStatus('unsure'); setAdvisorName(''); setPurpose(''); }} className="mt-5 text-sm font-semibold text-[#8B1E24] underline underline-offset-4 dark:text-[#FCA5A5]">Make another request</button></div> : <form onSubmit={submitRequest} className="space-y-5">
                  <div><p className="font-display text-xl font-bold text-[#0B2240] dark:text-white">Club website request</p><p className="mt-1 text-sm text-[#475569] dark:text-slate-300">We’ll send your request to the Pioneer Clubs team. You won’t need an email app.</p><p className="mt-1 break-all text-xs text-[#64748B] dark:text-slate-300">We’ll reply to {auth.user?.email}</p></div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block text-sm font-semibold text-[#0B2240] dark:text-white">Club or team name<span aria-hidden="true"> *</span><input required maxLength={100} value={clubName} onChange={(event) => setClubName(event.target.value)} placeholder="e.g. Robotics Club" className="mt-2 block w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-3 text-sm text-[#0B2240] dark:border-[#1E3A5F] dark:bg-[#071120] dark:text-white" /></label>
                    <label className="block text-sm font-semibold text-[#0B2240] dark:text-white">Campus<span aria-hidden="true"> *</span><select required value={campusSlug} onChange={(event) => setCampusSlug(event.target.value)} className="mt-2 block w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-3 text-sm text-[#0B2240] dark:border-[#1E3A5F] dark:bg-[#071120] dark:text-white"><option value="">Choose your campus</option>{campuses.map((campus) => <option key={campus.id} value={campus.slug}>{campus.name}</option>)}</select></label>
                  </div>
                  <label className="block text-sm font-semibold text-[#0B2240] dark:text-white">Where is your club in the school approval process?<select value={clubStatus} onChange={(event) => setClubStatus(event.target.value as ClubSiteRequestInput['clubStatus'])} className="mt-2 block w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-3 text-sm text-[#0B2240] dark:border-[#1E3A5F] dark:bg-[#071120] dark:text-white"><option value="unsure">I’m not sure yet</option><option value="approved">Already approved</option><option value="seeking-approval">Seeking approval</option></select></label>
                  <label className="block text-sm font-semibold text-[#0B2240] dark:text-white">Advisor or mentor <span className="font-normal text-[#64748B] dark:text-slate-300">(optional)</span><input maxLength={100} value={advisorName} onChange={(event) => setAdvisorName(event.target.value)} placeholder="Name, if confirmed" className="mt-2 block w-full rounded-xl border border-[#CBD5E1] bg-white px-3 py-3 text-sm text-[#0B2240] dark:border-[#1E3A5F] dark:bg-[#071120] dark:text-white" /></label>
                  <label className="block text-sm font-semibold text-[#0B2240] dark:text-white">What should the website help students do?<span aria-hidden="true"> *</span><textarea required maxLength={700} rows={4} value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Share your goal, activities, or what students should be able to find." className="mt-2 block w-full resize-y rounded-xl border border-[#CBD5E1] bg-white px-3 py-3 text-sm leading-6 text-[#0B2240] dark:border-[#1E3A5F] dark:bg-[#071120] dark:text-white" /></label>
                  <p className="text-xs leading-5 text-[#64748B] dark:text-slate-300">Please leave out private student details and photos. A request does not approve a club or publish a page.</p>
                  {(formError || request.error) && <p role="alert" className="rounded-xl bg-[#FFF4F2] p-3 text-sm font-semibold text-[#8B1E24] dark:bg-[#3B2026] dark:text-[#FCA5A5]">{formError || request.error}{request.error.includes('sign-in has ended') && <button type="button" onClick={() => void auth.signIn('/support#request-club-site')} className="ml-2 underline underline-offset-2">Sign in again</button>}</p>}
                  <button type="submit" disabled={request.pending} className="site-action inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#8B1E24] px-5 py-3 text-sm font-bold text-white hover:bg-[#A61C24] disabled:opacity-60"><Send className="h-4 w-4" aria-hidden="true" />{request.pending ? 'Sending request…' : 'Send request'}</button>
                </form> : <div className="max-w-lg">
                  <p className="font-display text-xl font-bold text-[#0B2240] dark:text-white">{auth.authenticated ? 'Use an eligible school account' : 'Sign in to make a request'}</p>
                  <p className="mt-3 text-sm leading-7 text-[#475569] dark:text-slate-300">{auth.authenticated ? 'This account cannot request a club website. Choose a school account with an email address so the team can follow up.' : 'Club website requests are for signed-in school members, so the team knows how to follow up. You can browse the answers above without signing in.'}</p>
                  {!auth.authenticated && auth.authIssue !== 'origin' && <button type="button" disabled={auth.signInPending} onClick={() => void auth.signIn('/support#request-club-site')} className="site-action mt-5 rounded-xl bg-[#8B1E24] px-5 py-3 text-sm font-bold text-white hover:bg-[#A61C24]">{auth.signInPending ? 'Checking sign-in…' : AUTH_COPY.signInWithSchool}</button>}
                  {auth.authenticated && <button type="button" onClick={() => auth.useAnotherAccount('/support#request-club-site')} className="site-action mt-5 rounded-xl bg-[#8B1E24] px-5 py-3 text-sm font-bold text-white hover:bg-[#A61C24]">{AUTH_COPY.switchSchoolAccount}</button>}
                  {(auth.status === 'error' || !auth.configured || auth.signInRetryFailed) && <p role="status" className="mt-4 text-sm text-[#8B1E24] dark:text-[#FCA5A5]">{auth.authIssue === 'origin' ? 'This website’s address does not match its sign-in setup. The portal team needs to correct it.' : 'School sign-in is unavailable right now.'} You can still <a href={helpEmail} className="font-semibold underline underline-offset-2">email the portal team</a> and browse public club pages.</p>}
                </div>}
              </div>
            </div>
          </div>
        </section>

        <section id="corrections" aria-labelledby="contact-heading" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="grid gap-5 rounded-3xl border border-[#DCE5F0] bg-[#EAF0F7] p-6 dark:border-[#1E3A5F] dark:bg-[#102A43] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-8">
            <div><p className="site-kicker text-xs font-bold text-[#8B1E24] dark:text-[#FCA5A5]">Need a person?</p><h2 id="contact-heading" className="mt-2 font-display text-xl font-bold text-[#0B2240] dark:text-white">Tell us what needs attention.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#475569] dark:text-slate-300">For a site problem or a correction, include the page link and what looks wrong. School decisions and urgent safety matters should go through official PCSS channels.</p></div>
            <a href={helpEmail} className="site-action inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0B2240] px-5 py-3 text-sm font-bold text-white dark:bg-[#8B1E24]"><Mail className="h-4 w-4" aria-hidden="true" />Email the portal team</a>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
