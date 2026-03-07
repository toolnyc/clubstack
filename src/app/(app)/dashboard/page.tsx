import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DJProfile } from "@/types";

interface CompletenessItem {
  label: string;
  done: boolean;
}

function getCompletenessItems(profile: DJProfile | null): CompletenessItem[] {
  return [
    { label: "Name", done: !!profile?.name },
    { label: "Bio", done: !!profile?.bio },
    { label: "Genres", done: (profile?.genres?.length ?? 0) > 0 },
    { label: "Photo", done: !!profile?.photo_url },
    { label: "Location", done: !!profile?.location },
    // TODO: replace with real calendar connection check (Issue #9)
    { label: "Calendar connected", done: false },
  ];
}

function WelcomeHeader({ profile }: { profile: DJProfile | null }) {
  const name = profile?.name ?? null;
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        {name ? `Welcome back, ${name}` : "Welcome to ClubStack"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {name
          ? "Here's an overview of your DJ profile."
          : "Get started by creating your DJ profile."}
      </p>
    </div>
  );
}

function OnboardingCTA() {
  return (
    <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-black text-2xl text-white">
          🎧
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          Create your DJ profile
        </h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Set up your profile to get discovered by venues and start receiving
          booking requests.
        </p>
        <Link
          href="/profile"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          Create profile
        </Link>
      </CardContent>
    </Card>
  );
}

function ProfileSummaryCard({ profile }: { profile: DJProfile }) {
  const isPublished = !!profile.slug;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Profile</CardTitle>
          <Badge variant={isPublished ? "success" : "warning"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
        <CardDescription>Your public DJ profile</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {profile.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.photo_url}
              alt={profile.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
              🎧
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">
              {profile.name}
            </p>
            {profile.location && (
              <p className="truncate text-sm text-gray-500">
                {profile.location}
              </p>
            )}
            {profile.genres && profile.genres.length > 0 && (
              <p className="text-sm text-gray-500">
                {profile.genres.length} genre
                {profile.genres.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
        {!isPublished && (
          <p className="mt-4 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
            Your profile is in draft. Publish it to appear in search.
          </p>
        )}
        <div className="mt-4">
          <Link
            href="/profile"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit profile
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function CalendarStatusCard() {
  // TODO: replace with real calendar connection check (Issue #9)
  const isConnected = false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Calendar</CardTitle>
          <Badge variant={isConnected ? "success" : "outline"}>
            {isConnected ? "Connected" : "Not connected"}
          </Badge>
        </div>
        <CardDescription>
          Sync your availability with Google Calendar
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div>
            <p className="text-sm text-gray-500">Last synced: just now</p>
            <div className="mt-4">
              <Link
                href="/calendar"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Manage calendar
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500">
              Connect your Google Calendar to automatically show your
              availability to venues.
            </p>
            <div className="mt-4">
              <Link
                href="/calendar"
                className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Connect calendar
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickStatsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stats</CardTitle>
        <CardDescription>Your activity at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="mt-1 text-xs text-gray-500">Bookings this month</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="mt-1 text-xs text-gray-500">Profile views</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileCompletenessCard({ profile }: { profile: DJProfile | null }) {
  const items = getCompletenessItems(profile);
  const doneCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const percentage = Math.round((doneCount / totalCount) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile completeness</CardTitle>
        <CardDescription>
          {doneCount} of {totalCount} complete
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-black transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-sm">
              <span className={item.done ? "text-green-600" : "text-gray-300"}>
                {item.done ? "✓" : "○"}
              </span>
              <span className={item.done ? "text-gray-700" : "text-gray-400"}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // maybeSingle() returns null (not an error) when no row exists
  const { data: profile } = await supabase
    .from("dj_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<DJProfile>();

  const djProfile: DJProfile | null = profile ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <div className="mb-8">
        <WelcomeHeader profile={djProfile} />
      </div>

      {!djProfile ? (
        <OnboardingCTA />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <ProfileSummaryCard profile={djProfile} />
          <CalendarStatusCard />
          <QuickStatsCard />
          <ProfileCompletenessCard profile={djProfile} />
        </div>
      )}
    </div>
  );
}
