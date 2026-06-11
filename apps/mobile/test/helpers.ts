import { supabase } from "@/lib/supabase";

export const TEST_PASSWORD = "testpass123";

export const SEEDED = {
  agencyUser: "agency@test.local",
  djUser: "dj@test.local",
  promoterUser: "promoter@test.local",
  venueUser: "venue@test.local",
  agencyId: "c1111111-1111-1111-1111-111111111111",
  djProfileId: "b1111111-1111-1111-1111-111111111111",
  bookingId: "11111111-aaaa-bbbb-cccc-111111111111",
} as const;

export async function signInAs(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });
  if (error) {
    throw new Error(
      `signInAs(${email}) failed: ${error.message}. ` +
        `Is the local Supabase stack running with seed data? (pnpm db:start, pnpm db:reset)`
    );
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}
