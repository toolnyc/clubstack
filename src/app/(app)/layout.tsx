import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="border-b bg-white">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="font-bold text-xl">
              ClubStack
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-sm font-medium hover:text-black">
                Dashboard
              </Link>
              <Link href="/profile" className="text-sm font-medium hover:text-black">
                Profile
              </Link>
              <Link href="/calendar" className="text-sm font-medium hover:text-black">
                Calendar
              </Link>
              <Link href="/settings" className="text-sm font-medium hover:text-black">
                Settings
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <span className="text-sm text-gray-700">{user.email}</span>
            </div>
            <form action={signOut}>
              <button 
                type="submit"
                className="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
