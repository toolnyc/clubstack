# ClubStack Research

## 1. Nowadays Unit Economics

**The Space**
- Indoor: 5,000 sq ft — 269 standing / 188 seated
- Outdoor yard: 16,000 sq ft — 800 standing / 350 seated
- Location: 56-06 Cooper Ave, Ridgewood/Bushwick border

**Founded** by DJs Eamon Harkin & Justin Carter. Started as a seasonal outdoor bar in 2015, bought the warehouse next door and opened indoor space in late 2017.

**Event Cadence**
- Thu/Fri/Sat nights (after 10pm) + all-day Sunday
- As of Jan 2024, "Nowadays Nonstop" 24-hour parties went from monthly to weekly — first licensed NYC club to regularly do multi-day continuous parties

**Ticket Pricing**
- Door tickets, roughly ~$25 range (varies by event)
- Positioned as accessible — "everyday New Yorkers for the price of a door ticket"

**What Makes Them Work**
- Quality over volume — not chasing max capacity, building repeat audience
- Premium sound + elite talent = justifies cover
- Affordable food & drink (margin maker, not a ripoff)
- Strict door/etiquette policy — protects the vibe, builds loyalty
- Community relations — weekday neighborhood meetings, film screenings, non-music events. Likely helped get regulatory flexibility for 24hr operations
- They own the warehouse (bought, not leased the indoor space) — massive advantage on fixed costs

**Back-of-napkin math**
- ~4 events/week, ~200-400 attendees avg, ~$25 door = $20K-$40K/week in door revenue
- Bar revenue on top (high margin)
- Private events / venue rentals during off-hours
- Outdoor space in summer is a huge seasonal boost (800 cap)

**Why they survive when 81% don't:** Own their space, tight operation, genuine community ties, repeat audience that treats it as home base.

**Key takeaway for ClubStack:** Bar revenue ($128-192K/mo estimated) dwarfs door revenue ($20-40K/mo). Ticketing is the entry point, not the profit center. A platform that helps venues optimize the *full* revenue picture — not just skim ticket fees — is a much better value prop. Nowadays is an ideal early customer: music-first, operationally serious, would benefit from better DJ booking/scheduling tools, philosophically aligned with artist-first values.

Sources:
- https://nowadays.nyc/
- https://ra.co/clubs/105873
- https://donyc.com/venues/nowadays
- https://thevendry.com/venue/156950/nowadays-queens-ny/space/75300
- https://thevendry.com/venue/156950/nowadays-queens-ny/space/75301
- https://dadastrain.substack.com/p/bklyn-sounds-1213202312192023-a-non
- https://www.nyctourism.com/nightlife/nowadays/

---

## 2. Ghost Model Applied to ClubStack

### How Ghost Works
- Non-profit, open-source publishing platform
- **0% revenue cut** — flat monthly subscription only
- Revenue: $8.5M/year ARR; publishers have earned $100M+ through the platform
- Pricing tiers:
  - Starter: $15/mo (1,000 members, 1 user)
  - Publisher: $29/mo (100K members, 3 users)
  - Business: $199/mo (100K members, unlimited users)
  - Enterprise: custom
- Creators keep 100% of subscription revenue (minus Stripe's ~2.9%)
- Self-hosting is free — Ghost Pro is the managed hosting product

### Translated to ClubStack

If ClubStack charged venues a flat fee and took 0% of ticket sales (beyond Stripe processing), here's the math:

**Assumptions** (from session 1 market research):
- Mid-size venue: 500 cap, ~$50K/mo ticket revenue, 10-14 events/month
- Stripe processing: ~2.9% + $0.30/txn (passed through, not ClubStack revenue)

**What venues currently pay RA:** ~10% of ticket revenue = ~$5,000/mo

**ClubStack pricing to sustain a one-person business:**
- Target: $10K-$15K/mo personal income + $3-5K/mo infrastructure costs = ~$15-20K/mo needed
- At $199/mo (Ghost Business equivalent): need 75-100 paying venues — too many for launch
- At $499/mo: need 30-40 venues — achievable but tight
- At $999/mo: need 15-20 venues — realistic for NYC underground scene
- Even at $999/mo, that's **80% cheaper than RA's 10% cut** for a venue doing $50K/mo in tickets

**The pitch:** "You're paying RA $5,000/month in commissions. Pay us $999/month flat. Keep the other $4,000."

**Ghost model advantages for ClubStack:**
- Venues know exactly what they're paying — no surprise fees
- ClubStack's incentives align with venue success (not ticket volume)
- Simpler billing, simpler accounting
- Philosophical alignment with artist-first values

**Ghost model risks:**
- Small venues ($10-15K/mo ticket revenue) won't save much vs. RA — need tiered pricing
- Venues with low/no ticket revenue (bar-only nights) still need to justify the fee
- RA provides discovery (6M monthly users) — ClubStack doesn't, so the value prop must be operational

Sources:
- https://www.sender.net/reviews/ghost/pricing/
- https://forum.ghost.org/t/updated-ghost-pro-pricing-july-2025-15-mo-starter-29-mo-publisher-199-mo-business/59090

---

## 3. DJ Network as Go-to-Market

### Would DJs Actually Keep Calendars Updated?

**Problem:** DJs are notoriously bad at admin. Most manage bookings via email, DMs, spreadsheets, or just memory. The booking process is full of lost emails, back-and-forth texts, and no centralized system.

**Google Calendar sync is the right hook.** Existing tools that do this:
- **GigPlanner** — lets session musicians share availability across groups, auto-blocks dates
- **Vev** — auto-syncs gig bookings to personal calendar
- **Gigwell** — has Google Calendar sync in Smart Holds Calendar (but designed for agencies, not solo DJs)

**Key insight:** DJs won't fill out another platform's calendar. But if ClubStack *reads* their existing Google Calendar and marks them as unavailable when they have gigs, the friction drops to near zero. The DJ just has to connect their calendar once.

### Career DJs vs. Hobbyists — Where's the Line?

Career DJ signals:
- Regular bookings (2-4+/month)
- Has an agent or manages own bookings professionally
- Produces music / has releases on labels
- Has a following (RA page, SoundCloud, social media)
- Gets paid real fees ($200-2000+/night at the underground level)

Hobbyist signals:
- Plays occasionally, mostly friends' parties or open decks
- No releases, no agent
- Day job is primary income

**Practical filter:** Require an invite or application with links to mixes/releases. The ClubStack brand (11K IG) gives credibility to curate.

### Existing DJ Booking Tools — What's Out There

**Gigwell**
- Rating: 4.5/5 (98 reviews)
- Designed for agencies managing rosters, not individual DJs
- Complaints: laggy backend, hidden payment fees, dates off by one day in calendar, steep learning curve (6+ months), not user-friendly for beginners
- Pricing: not published (enterprise-ish, custom quotes)

**Prism.fm**
- Used by 10,000+ venues worldwide
- Strong on show settlements, task tracking, financial reporting
- No mobile app, no integrated email, no automated workflows
- Pricing: not published, annual increases noted
- More venue/promoter tool than DJ tool

**What DJs hate about both:** These are built for the *buyer* side (agencies, venues, promoters). Individual DJs — especially underground ones — have essentially no purpose-built tool. They're using:
- Instagram DMs
- Email threads
- WhatsApp groups
- Spreadsheets
- Nothing

**ClubStack opportunity:** Be the first tool built *for the DJ* that also serves venues. Not an agency tool adapted for individuals — a DJ-first tool that venues and promoters can tap into.

### Subvert.fm — Related Model
- Cooperative-owned music marketplace (Bandcamp alternative, not booking)
- 0% platform fees — funded by optional tips
- 1,000+ labels pre-launch
- "One member, one vote" governance
- Launched late 2025
- Relevant as philosophical inspiration, not a direct competitor

Sources:
- https://www.gigwell.com/blog/gigwell-vs-prism
- https://www.softwareadvice.com/event-booking/gigwell-profile/
- https://www.capterra.com/p/162663/Gigwell/reviews/
- https://prism.fm/
- https://gigplanner.com/
- https://www.zipdj.com/blog/dj-pain-points-2
- https://subvert.fm/
- https://www.thefader.com/2025/10/14/subvert-fm-bandcamp-interview

---

## 4. Pricing — Who Pays and How Much

### The Landscape

**What venues currently pay:**
- RA: ~10% of ticket revenue
- Eventbrite: ~3.7% + $1.79/ticket (organizer pays) or 7.9% + $0.79 (buyer pays)
- DICE: takes a cut (not published, estimated 5-10%)
- Ticket Tailor: flat fee per ticket (£0.22-0.60/ticket, ~$0.28-0.76)

**Venue management SaaS:**
- Prism.fm: custom pricing, not published (enterprise-oriented)
- OpenDate: custom pricing, not published
- Crescat: from €99/mo (~$107/mo), with grassroots discount program
- Gigwell: custom pricing, not published

### Three Concrete Pricing Options for ClubStack

**Option A: Ghost Model — Flat Monthly, 0% Ticket Cut**
| Tier | Price | Target |
|------|-------|--------|
| Starter | $199/mo | Small venues, <200 cap, <$15K/mo tickets |
| Growth | $499/mo | Mid venues, 200-500 cap, $15-50K/mo tickets |
| Pro | $999/mo | Large venues, 500+ cap, $50K+/mo tickets |

- Pros: Simple, predictable, massive savings vs. RA for bigger venues
- Cons: Hard sell for small venues barely surviving; $199/mo is a lot when you're unprofitable
- Sustainability: need ~20-30 venues to hit $15K/mo personal income

**Option B: Ticket Tailor Model — Flat Fee Per Ticket, No Subscription**
| Volume | Per Ticket |
|--------|-----------|
| Pay-as-you-go | $0.50/ticket |
| Prepaid 1,000 | $0.35/ticket |
| Prepaid 5,000 | $0.25/ticket |

- Pros: Scales with venue activity; no commitment for slow months; easy to try
- Cons: Revenue is unpredictable for ClubStack; high-volume venues might prefer flat rate
- Math: venue doing 2,000 tickets/mo = $500-1,000/mo (competitive with Option A)
- Sustainability: need ~20K-30K tickets/mo across all venues = 10-15 active mid-size venues

**Option C: Hybrid — Free DJ Network + Venue Subscription + Small Ticket Fee**
| Component | Price |
|-----------|-------|
| DJ profiles & calendar | Free |
| Venue booking tools | $149/mo base |
| Ticketing | $0.25/ticket (or pass to buyer) |

- Pros: DJs join for free (network grows fast), venues pay for access to the network + tools, ticket fee covers payment infrastructure
- Cons: More complex pricing to explain
- Math: 20 venues × $149 = $2,980/mo base + ticket revenue on top
- Sustainability: realistic path to $10-15K/mo with 20-30 venues

### Recommendation

**Option C is the most ClubStack-aligned.** It mirrors the "DJs free, institutions pay" philosophy from session 1. The free DJ network is the growth engine. The venue subscription is the revenue engine. The per-ticket fee is small enough that nobody cares but it covers Stripe + margin.

The key insight from Ticket Tailor ($6.6M/yr, solo founder): you don't need thousands of enterprise customers. You need a focused niche that loves you.

Sources:
- https://www.tickettailor.com/pricing
- https://www.capterra.com/p/112510/Ticket-Tailor/pricing/
- https://crescat.io/pricing
- https://www.opendate.io/info/event-venue-booking-software

---

## 5. What to Build First — V0.1

### The Minimum Product That Gets DJs to Sign Up and Venues to Pay

**Phase 1: DJ Network (Free) — The Growth Engine**

Build first because:
- Zero revenue pressure — it's free, so quality bar is lower
- Creates supply before you need demand
- ClubStack's 11K IG audience is the seed
- Every DJ who joins = marketing to their followers

MVP features:
1. **DJ Profile** — name, photo, bio, genres, links to mixes (SoundCloud/Mixcloud embed)
2. **Availability Calendar** — Google Calendar sync (read-only). Green = available, red = booked. DJ connects once, never has to update manually
3. **Mix/release portfolio** — embed existing content, don't host it
4. **Browse/search** — venues can browse DJs by genre, availability, location

What to skip in V0.1:
- Messaging (use email links for now)
- Payments/invoicing
- Reviews/ratings
- Social features

Tech: Next.js + Supabase. Google Calendar API for sync. Simple auth (email magic link or Google OAuth).

**Phase 2: Venue Booking Tools ($149/mo) — The Revenue Engine**

Build second, once you have 50-100 DJ profiles:

MVP features:
1. **Venue dashboard** — see your upcoming events, who's booked, who's available
2. **Send booking requests** — pick a DJ, pick a date, send offer (fee, set time, details)
3. **DJ accepts/declines** — simple flow, auto-updates both calendars
4. **Event calendar** — venue's public-facing event schedule
5. **Basic contracts** — simple digital agreement (date, fee, set time, terms)

What to skip in V0.1:
- Ticketing (use Ticket Tailor or RA for now — integrate later)
- Payments/escrow (venues pay DJs directly for now)
- Analytics
- Promoter accounts (venues only first)

**Phase 3: Ticketing ($0.25/ticket) — The Moat**

Build third, once booking flow is validated:
- Stripe Connect integration
- Embeddable ticket widget for venue websites
- Door list / check-in
- Basic sales reporting

### Launch Sequence

1. **Weeks 1-4:** Build DJ profiles + calendar sync. Seed with 20-30 DJs from ClubStack's network
2. **Weeks 5-8:** Build venue dashboard + booking flow. Onboard 3-5 friendly venues (Basement, Signal, etc.)
3. **Weeks 9-12:** Iterate based on feedback. Add ticketing if booking is working
4. **Month 4+:** Start charging venues. Add more DJs organically

### Stack
- **Frontend:** Next.js (App Router)
- **Backend/DB:** Supabase (Postgres + Auth + Realtime)
- **Payments (later):** Stripe Connect
- **Calendar:** Google Calendar API
- **Hosting:** Vercel
- **Email:** Resend or Supabase built-in

---

## 6. How DJs Actually Get Paid (Current State)

### The Booking-to-Payment Flow

For the majority of underground DJs without agents, bookings happen through direct outreach and relationships:

1. Promoter/talent buyer finds DJ via RA, SoundCloud, Instagram, or word of mouth
2. Initial contact via Instagram DM or email — entirely relationship-based
3. Fee negotiation over DM/email/text — no formal system
4. Confirmation is a written email at best, verbal at worst
5. Payment at end of night — usually cash

### Payment Timing by DJ Tier

- **Local resident/opener (no agent):** Cash at end of night. No invoice, no paper trail. "More often than not DJs are hired with a phone call and paid in cash at the end of the night so that it's off the books." — Serato forum
- **Mid-level touring DJ (agented):** 50% deposit via bank transfer before event, 50% at soundcheck or before set
- **Headliner:** 100% upfront or 50% weeks in advance, balance at load-in. Won't perform without payment confirmed.

### Pain Points

- **Non-payment:** Clubs claim the night went badly, or the promoter ghosts. Small claims court isn't worth it for $300.
- **Late payment:** Weeks of follow-up emails and texts. Documented cases of invoices "lost," bank details "not received."
- **Bounced checks:** Documented case of a DJ chasing $300 for three weeks, finally getting a check that bounced — costing $12 in bank fees.
- **Post-hoc renegotiation:** Venues trying to pay $200 on a $300 agreement at collection time.
- **Delayed payment at larger venues:** Reports of 2-3 month payment delays.

Industry assessment: "The industry globally is rife with stories of 'pay-for-play', 'play-for-exposure' and 'no-payment-after-promise'."

### Agent Commissions

- Booking agents: **10-15%** of booking fee (up to 20% for full-service boutique agencies)
- Managers: **15-20%** of total gross income (rare at underground level)
- Mobile/wedding DJ agencies: up to **30%** (different market entirely)
- Most underground DJs have no agent — they self-book via DMs and email

### Payment Methods

| Method | Context |
|---|---|
| Cash | Most common for underground/local club gigs |
| Bank transfer / ACH | Agented DJs, larger venue deposits |
| PayPal | Some smaller gigs, remote bookings |
| Venmo / Zelle | Informal, among trusted parties |
| Check | Corporate events, formal venues |

No DJ-specific payment platform exists with meaningful adoption.

### Tax Compliance

- **Underground level:** Largely fictional. Cash gigs unreported. No W-9s filed, no 1099s issued.
- **Legal requirement:** Venues must request W-9 and file 1099-NEC for any DJ paid $600+/year. Almost never happens at small clubs.
- **If DJ refuses W-9:** Venue must withhold 24% as backup withholding. In practice, clubs just pay cash.
- **DJs who do report:** Independent contractors, Schedule C, 15.3% self-employment tax on top of income tax.

### Promoter Economics (Why DJs Get Stiffed)

**Model 1 — In-house venue booking:** DJ budget comes from club's operating budget. DJ gets a flat guarantee or door split.

**Model 2 — External promoter rents the club:** Promoter pays venue rental or minimum bar guarantee, keeps door revenue. Promoter pays DJ out of pocket before knowing if the night will be profitable. If presales are weak, the promoter is stretched — this is exactly when DJs get stiffed.

Key quote: "We now have to play with very risky budgets... we have to completely sell out our shows in order to make money." — Montreal promoter, Resident Advisor

### NYC Fee Ranges (300-600 Cap Underground Venues)

| Role | Fee Range |
|---|---|
| Resident DJ (weekly/monthly) | $200-500/night |
| Opening/support (local, no agent) | $100-300 |
| Guest DJ (local name, real following) | $500-1,500 |
| Headliner / international touring | $1,500-5,000+ |

Average across all bookings: ~$500

Sources:
- https://www.vice.com/en/article/how-to-get-paid-to-dj-according-to-djs-who-get-paid-to-dj/
- https://serato.com/forum/discussion/39065
- https://serato.com/forum/discussion/111281
- https://serato.com/forum/discussion/156945
- https://ra.co/news/78323
- https://www.decodedmagazine.com/the-economics-are-broken-how-touring-dj-fees-are-killing-clubs-and-why-residents-are-the-answer/
- https://jwdjagency.com/what-percentage-should-dj-agents-take/
- https://theforkcpas.com/tax-considerations-when-paying-artists-in-your-restaurant-bar-or-nightclub/

---

## 7. Ticketing Industry Fee Structures

### Who Charges What

| Platform | Fee | Who Pays | Model |
|---|---|---|---|
| Ticketmaster | 15-25% + $3-5 order fee | Buyer | Venue keeps ~2/3 of fee |
| Eventbrite | 3.7% + $1.79/ticket + 2.9% processing | Buyer (or organizer absorbs) | ~10% effective on $50 ticket |
| DICE | ~10-25% (varies) | Buyer | Split between DICE and promoter |
| RA | ~10% | Buyer | Promoter receives face value |
| Posh | 10% + $0.99/ticket | Buyer | Organizer pays $0 |
| Ticket Tailor | ~$0.65/ticket flat | Organizer (can pass to buyer) | No percentage |
| Ticket Fairy | ~5-10% + processing | Buyer | Organizer pays $0 |

### Key Insights

- **Buyer-pays is industry standard.** RA, DICE, Posh, Ticket Fairy all charge the buyer, not the venue. Venues pay $0 upfront.
- **Buyers tolerate up to ~10-12%** without significant cart abandonment. Under 10% rarely generates complaints.
- **Ticket Tailor** ($6.6M/yr, 34 people, bootstrapped) proves flat-fee-per-ticket works at scale. ~10-11M tickets/year across their platform.
- **Posh** (VC-backed, $95M+ lifetime GMV) proves organizer-free, buyer-pays works for growth.

### Stripe Connect Mechanics

- Platform sets `application_fee_amount` on each PaymentIntent
- Buyer pays full amount → Stripe takes processing (~2.9% + $0.30) → platform keeps application fee → venue receives remainder
- Platform fee is arbitrary — set whatever you want
- Destination charges (platform collects, transfers to venue) is the standard pattern

Sources:
- https://www.tickettailor.com/pricing
- https://stripe.com/connect/pricing
- https://docs.stripe.com/connect/marketplace/tasks/app-fees

---

## 8. Revised Business Model (Current)

### The Core Insight

The biggest unmet need in the underground DJ ecosystem isn't cheaper ticketing — it's **reliable payment and professional booking infrastructure.** DJs are getting paid in cash at 2am with no paper trail, chasing promoters for weeks, and doing their taxes on guesswork. Venues are booking via Instagram DMs and managing talent in their heads.

### Model: "DJs Keep 100%"

**DJs — Free, forever:**
- Profile + portfolio (SoundCloud/Mixcloud embeds)
- Google Calendar sync (read-only availability)
- Booking management (accept/decline, see upcoming gigs)
- Guaranteed payment via escrow
- Automatic invoicing and tax documentation (1099-ready)
- Browse/search visibility to venues

**Venues — 8% booking fee on confirmed bookings:**
- DJ quotes $500 → venue pays $540 → DJ receives $500 → ClubStack keeps $40
- Fee is on top of DJ rate, never deducted from the artist
- Venue gets: searchable DJ network with real-time availability, one-click booking, automatic payment processing, W-9/1099 compliance, booking history
- 8% is cheaper than any agent (10-15%) and includes payment infrastructure agents don't provide

**Ticketing — Phase 3 (future):**
- Buyer-pays service fee, exact structure TBD
- Not required for initial revenue — booking facilitation sustains the business
- Will use Stripe Connect destination charges

### Why 8% and Why the Venue Pays

- Venues are the buyers in this marketplace — buyers pay transaction costs
- 8% is less than agent commission (10-15%) for more functionality
- DJ gets 100% of their quoted rate — genuinely artist-first, not marketing spin
- Escrow solves the #1 DJ pain point (non-payment) which justifies the fee to venues
- Venues save hours of DM/email booking and cash payment logistics

### Comparison to Current Options

| | RA | Agent | ClubStack |
|---|---|---|---|
| Cost to venue | ~10% of tickets (buyer fee) | 10-15% of DJ fee | 8% of DJ fee |
| Cost to DJ | $0 | 10-15% of their fee | $0 |
| DJ gets paid | Not involved | Agent ensures payment | Escrow, guaranteed |
| Booking tools | Event listing only | Email/phone | Full platform |
| Tax compliance | N/A | N/A | Automatic |
| Discovery | 6M monthly users | Agent's network | DJ network + calendar |

### Revenue Math

**Target: $8-10K/month (solo founder)**

| Venues | Bookings/mo | Avg DJ Fee | 8% Revenue |
|--------|-------------|------------|------------|
| 5 | 125 | $500 | $5K |
| 8 | 200 | $500 | $8K |
| 10 | 250 | $500 | $10K |
| 15 | 375 | $500 | $15K |

8 active NYC venues gets to $8K/mo. Each venue averaging 25 bookings/month (10-12 events, 2-3 DJs each).

**Infrastructure costs:** ~$500-1K/mo (Supabase, Vercel, Stripe, Google API, email)

### What to Build (Revised Phases)

**Phase 1: DJ Network + Calendar (Free) — Weeks 1-4**
- DJ profiles (name, photo, bio, genres, mix embeds)
- Google Calendar sync (read-only availability)
- Browse/search for venues
- Auth via Google OAuth or email magic link
- Seed with 20-30 DJs from ClubStack's 11K IG network

**Phase 2: Venue Booking + Payments (8% fee) — Weeks 5-10**
- Venue accounts + dashboard
- Send booking requests (pick DJ, date, offer fee)
- DJ accepts/declines flow
- Stripe Connect escrow (venue pays on confirmation, DJ receives post-gig)
- Automatic invoicing + W-9/1099 infrastructure
- Basic contracts (date, fee, set time, terms)
- **This is where revenue starts**

**Phase 3: Ticketing (buyer service fee) — Month 4+**
- Stripe Connect for ticket sales
- Embeddable ticket widget
- Door list / check-in
- Sales reporting
- Exact fee structure TBD based on market feedback

### Open Questions

1. **Demand validation:** Have not yet talked to venue bookers or DJs. Need 5+ venue conversations and 10+ DJ conversations before building.
2. **Escrow mechanics:** Exactly when does money release? 24 hours post-gig? Does the DJ confirm the gig happened? What about disputes?
3. **8% vs 10%:** 8% is the working number. May need to test. 10% is still cheaper than agents and could push revenue to $10K with fewer venues.
4. **Discovery gap:** ClubStack has no audience for ticket buyers. Fine for Phase 1-2 (booking tool), but Phase 3 ticketing needs an answer.
5. **Legal:** Are simple digital booking agreements legally sufficient? What liability does ClubStack carry as a payment intermediary?
6. **Google Calendar API:** Need to prototype the OAuth flow and confirm read-only access works for availability detection.
7. **Cash-heavy culture:** Many underground venues prefer cash specifically to avoid tax records. Will they adopt a platform that creates a paper trail? Target the venues that are already operating professionally.

### Key Decisions Summary

| Decision | Answer |
|----------|--------|
| Who pays? | Venues pay 8% booking fee. DJs free. |
| How? | Fee added on top of DJ rate, never deducted from artist |
| Core value prop? | "DJs keep 100%. Guaranteed payment. No more chasing." |
| What to build first? | DJ profiles + calendar sync (free) |
| Revenue trigger? | Venue booking + Stripe Connect escrow (8% per booking) |
| Ticketing? | Phase 3 — use existing platforms until then |
| Target market? | NYC underground, 200-600 cap, music-first venues |
| Tech stack? | Next.js + Supabase + Stripe Connect + Vercel |
| Team size? | Solo founder. Partner later if needed. |
| Revenue target? | $8-10K/mo = 8-10 active venues |
| VC? | No. Bootstrapped. |
