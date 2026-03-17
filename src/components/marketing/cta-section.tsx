import { WaitlistForm } from "./waitlist-form";

export function CtaSection() {
  return (
    <section className="cta-section">
      <div className="cta-section__container">
        <p className="cta-section__eyebrow">Private beta</p>
        <h2 className="cta-section__heading">Get early access.</h2>
        <p className="cta-section__sub">
          Onboarding DJs, promoters, and agencies in New York first.
        </p>
        <WaitlistForm />
      </div>
    </section>
  );
}
