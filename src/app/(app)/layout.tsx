import { AppShell } from "@/components/layout/app-shell";
import { getProfile } from "@/lib/auth/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  return <AppShell userType={profile?.user_type ?? null}>{children}</AppShell>;
}
