"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SteppedFlow } from "@/components/ui/stepped-flow";
import { StepEvent } from "./step-event";
import { StepDates } from "./step-dates";
import { StepArtists } from "./step-artists";
import { StepCostsReview } from "./step-costs-review";
import { createBooking } from "@/lib/booking/actions";
import type {
  CreateBookingInput,
  Venue,
  Promoter,
  RosterEntry,
} from "@clubstack/shared";

interface BookingFormProps {
  venues: Venue[];
  promoters: Promoter[];
  roster: RosterEntry[];
}

export interface EventDetails {
  venue_id: string;
  venue_name: string;
  promoter_id: string;
  promoter_name: string;
  event_name: string;
  payer_type: "venue" | "promoter";
  notes: string;
}

export interface DateEntry {
  id: string;
  date: string;
  set_time: string;
  load_in_time: string;
  event_name: string;
}

export interface ArtistEntry {
  id: string;
  dj_profile_id: string;
  name: string;
  fee: number;
  commission_pct: number;
  payment_split_pct: number;
}

export interface CostEntry {
  id: string;
  description: string;
  amount: number;
  category: "travel" | "accommodation" | "equipment" | "other";
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function BookingForm({ venues, promoters, roster }: BookingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [eventDetails, setEventDetails] = useState<EventDetails>({
    venue_id: "",
    venue_name: "",
    promoter_id: "",
    promoter_name: "",
    event_name: "",
    payer_type: "promoter",
    notes: "",
  });

  const [dates, setDates] = useState<DateEntry[]>([
    {
      id: generateId(),
      date: "",
      set_time: "",
      load_in_time: "",
      event_name: "",
    },
  ]);

  const [artists, setArtists] = useState<ArtistEntry[]>([]);

  const [costs, setCosts] = useState<CostEntry[]>([]);

  function validateDates(): boolean {
    return dates.some((d) => d.date !== "");
  }

  function validateArtists(): boolean {
    if (artists.length === 0) return false;
    return artists.every((a) => a.dj_profile_id && a.fee > 0);
  }

  function handleSubmit() {
    setError(null);

    const input: CreateBookingInput = {
      booking: {
        venue_id: eventDetails.venue_id || undefined,
        promoter_id: eventDetails.promoter_id || undefined,
        payer_type: eventDetails.payer_type,
        notes: eventDetails.notes || undefined,
      },
      dates: dates
        .filter((d) => d.date !== "")
        .map((d) => ({
          date: d.date,
          set_time: d.set_time || undefined,
          load_in_time: d.load_in_time || undefined,
          event_name: d.event_name || eventDetails.event_name || undefined,
        })),
      artists: artists.map((a) => ({
        dj_profile_id: a.dj_profile_id,
        fee: a.fee,
        commission_pct: a.commission_pct,
        payment_split_pct: a.payment_split_pct,
      })),
      costs: costs
        .filter((c) => c.description && c.amount > 0)
        .map((c) => ({
          description: c.description,
          amount: c.amount,
          category: c.category,
        })),
    };

    startTransition(async () => {
      const result = await createBooking(input);
      if (result.error) {
        setError(result.error);
      } else if (result.bookingId) {
        router.push(`/bookings/${result.bookingId}`);
      }
    });
  }

  const steps = [
    {
      title: "Event",
      content: (
        <StepEvent
          venues={venues}
          promoters={promoters}
          value={eventDetails}
          onChange={setEventDetails}
        />
      ),
    },
    {
      title: "Dates",
      content: <StepDates value={dates} onChange={setDates} />,
      validate: validateDates,
    },
    {
      title: "Artists",
      content: (
        <StepArtists roster={roster} value={artists} onChange={setArtists} />
      ),
      validate: validateArtists,
    },
    {
      title: "Review",
      content: (
        <StepCostsReview
          artists={artists}
          costs={costs}
          onCostsChange={setCosts}
          eventDetails={eventDetails}
          dates={dates}
          error={error}
        />
      ),
    },
  ];

  return (
    <SteppedFlow
      steps={steps}
      onComplete={handleSubmit}
      loading={isPending}
      className="booking-form"
    />
  );
}

export { BookingForm, generateId };
export type { BookingFormProps };
