"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseICS } from "./ics-parser";

const WeeklyAvailabilitySchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  is_available: z.boolean(),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
});

const BlockDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const ImportICSSchema = z.object({
  icsText: z.string().min(1),
});

export async function getManualAvailability() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated", data: null };

  const { data, error } = await supabase
    .from("manual_availability")
    .select("*")
    .eq("user_id", user.id)
    .order("day_of_week", { ascending: true, nullsFirst: false })
    .order("specific_date", { ascending: true });

  if (error) return { error: error.message, data: null };

  return { error: null, data };
}

export async function setWeeklyAvailability(
  entries: z.infer<typeof WeeklyAvailabilitySchema>[]
) {
  const parsed = z.array(WeeklyAvailabilitySchema).safeParse(entries);
  if (!parsed.success) return { error: parsed.error.message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Delete existing weekly rules, then insert new ones
  const { error: deleteError } = await supabase
    .from("manual_availability")
    .delete()
    .eq("user_id", user.id)
    .not("day_of_week", "is", null);

  if (deleteError) return { error: deleteError.message };

  if (parsed.data.length === 0) return { error: null };

  const rows = parsed.data.map((entry) => ({
    user_id: user.id,
    day_of_week: entry.day_of_week,
    specific_date: null,
    is_available: entry.is_available,
    start_time: entry.start_time,
    end_time: entry.end_time,
  }));

  const { error: insertError } = await supabase
    .from("manual_availability")
    .insert(rows);

  if (insertError) return { error: insertError.message };

  return { error: null };
}

export async function blockDate(input: z.infer<typeof BlockDateSchema>) {
  const parsed = BlockDateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Upsert: if this date already exists, update it
  const { error } = await supabase.from("manual_availability").upsert(
    {
      user_id: user.id,
      day_of_week: null,
      specific_date: parsed.data.date,
      is_available: false,
      start_time: null,
      end_time: null,
    },
    { onConflict: "user_id,specific_date", ignoreDuplicates: false }
  );

  if (error) return { error: error.message };

  return { error: null };
}

export async function unblockDate(input: z.infer<typeof BlockDateSchema>) {
  const parsed = BlockDateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("manual_availability")
    .delete()
    .eq("user_id", user.id)
    .eq("specific_date", parsed.data.date);

  if (error) return { error: error.message };

  return { error: null };
}

export async function importICS(input: z.infer<typeof ImportICSSchema>) {
  const parsed = ImportICSSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.message, imported: 0 };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated", imported: 0 };

  const events = parseICS(parsed.data.icsText);

  if (events.length === 0) {
    return { error: "No events found in ICS data", imported: 0 };
  }

  // Deduplicate dates — multiple events on the same day only need one block
  const uniqueDates = [...new Set(events.map((e) => e.date))];

  const rows = uniqueDates.map((date) => ({
    user_id: user.id,
    day_of_week: null,
    specific_date: date,
    is_available: false,
    start_time: null,
    end_time: null,
  }));

  const { error } = await supabase
    .from("manual_availability")
    .upsert(rows, {
      onConflict: "user_id,specific_date",
      ignoreDuplicates: true,
    });

  if (error) return { error: error.message, imported: 0 };

  return { error: null, imported: uniqueDates.length };
}
