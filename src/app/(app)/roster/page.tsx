import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/actions";
import { getAgency, getRoster } from "@/lib/agency/actions";
import { RosterPageClient } from "./roster-page-client";

export default async function RosterPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  if (profile.user_type !== "agency") {
    redirect("/dashboard");
  }

  const agency = await getAgency();
  if (!agency) redirect("/dashboard");

  const roster = await getRoster();

  return <RosterPageClient agency={agency} roster={roster} />;
}
