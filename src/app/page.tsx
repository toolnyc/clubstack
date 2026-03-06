import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-48 pb-32 min-h-screen">
        <p className="mb-6 text-xs font-semibold tracking-[0.3em] uppercase text-neutral-500">
          Underground booking, simplified
        </p>
        <h1 className="max-w-3xl text-5xl md:text-7xl font-bold tracking-tight leading-none text-white">
          The booking platform for underground music.
        </h1>
        <p className="mt-6 max-w-xl text-lg md:text-xl text-neutral-400 leading-relaxed">
          DJs get paid. Venues book talent. No more cash at 2am.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="#"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-black font-semibold text-base px-8 py-4 hover:bg-neutral-200 transition-colors"
          >
            I&apos;m a DJ
          </Link>
          <Link
            href="#"
            className="w-full sm:w-auto inline-flex items-center justify-center border border-white text-white font-semibold text-base px-8 py-4 hover:bg-white hover:text-black transition-colors"
          >
            I&apos;m a Venue
          </Link>
        </div>
      </section>

      {/* Value Props */}
      <section className="px-6 py-24 bg-neutral-950">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-xs font-semibold tracking-[0.3em] uppercase text-neutral-500 mb-16">
            Built for the underground
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* For DJs */}
            <Card>
              <CardHeader>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-neutral-500 mb-3">
                  For DJs
                </p>
                <CardTitle>Keep 100% of your fee.</CardTitle>
              </CardHeader>
              <CardContent>
                Get guaranteed payment, automatic invoicing, and tax docs — so
                you can focus on the music, not chasing money.
              </CardContent>
            </Card>

            {/* For Venues */}
            <Card>
              <CardHeader>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-neutral-500 mb-3">
                  For Venues
                </p>
                <CardTitle>Browse top local talent.</CardTitle>
              </CardHeader>
              <CardContent>
                Discover DJs, check availability, and book and pay in one place.
                No back-and-forth. No surprises.
              </CardContent>
            </Card>

            {/* How it works */}
            <Card>
              <CardHeader>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-neutral-500 mb-3">
                  How it works
                </p>
                <CardTitle>Three steps.</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center border border-neutral-700 text-xs font-bold text-neutral-400">
                      1
                    </span>
                    <span>Create your profile</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center border border-neutral-700 text-xs font-bold text-neutral-400">
                      2
                    </span>
                    <span>Get booked by venues</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center border border-neutral-700 text-xs font-bold text-neutral-400">
                      3
                    </span>
                    <span>Get paid automatically</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-32 text-center bg-black">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-neutral-400">
            Join the waitlist. We&apos;re onboarding DJs and venues now.
          </p>
          <div className="mt-10">
            <Link
              href="#"
              className="inline-flex items-center justify-center bg-white text-black font-semibold text-base px-10 py-4 hover:bg-neutral-200 transition-colors"
            >
              Join the Waitlist
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
