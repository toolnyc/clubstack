import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-black">
      <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-lg font-bold tracking-tight text-white">
            ClubStack
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            The booking platform for underground music.
          </p>
        </div>
        <nav className="flex items-center gap-6 text-sm text-neutral-500">
          <Link href="#" className="hover:text-white transition-colors">
            For DJs
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            For Venues
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
            Privacy
          </Link>
        </nav>
        <p className="text-xs text-neutral-600">
          &copy; {new Date().getFullYear()} ClubStack. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
