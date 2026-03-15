import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section className="cta-section">
      <div className="cta-section__container">
        <h2 className="cta-section__heading">Ready to get booked?</h2>
        <p className="cta-section__subtitle">
          Whether you spin records or run the room, ClubStack has you covered.
        </p>
        <div className="cta-section__paths">
          <div className="cta-section__path">
            <h3 className="cta-section__path-title">For DJs</h3>
            <p className="cta-section__path-description">
              Create your profile, sync your calendar, and start getting booked.
              Free forever &mdash; no catch.
            </p>
            <Button variant="primary" size="lg">
              Create DJ profile
            </Button>
          </div>
          <div className="cta-section__divider" aria-hidden="true" />
          <div className="cta-section__path">
            <h3 className="cta-section__path-title">For venues</h3>
            <p className="cta-section__path-description">
              Browse DJs, manage bookings, and guarantee payment &mdash; all
              from one dashboard.
            </p>
            <Button variant="secondary" size="lg">
              Start free trial
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
