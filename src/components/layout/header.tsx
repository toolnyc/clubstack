import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-800 bg-black/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-white hover:text-neutral-300 transition-colors"
        >
          ClubStack
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="#"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            For DJs
          </Link>
          <Link
            href="#"
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            For Venues
          </Link>
          <Link
            href="#"
            className="text-sm font-semibold border border-white text-white px-4 py-2 hover:bg-white hover:text-black transition-colors"
          >
            Join Waitlist
          </Link>
        </nav>
      </div>
    </header>
  );
}
