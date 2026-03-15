"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Disc3, Building2, Users, Megaphone } from "lucide-react";
import { createProfile } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserType } from "@/types";

const USER_TYPES: {
  type: UserType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  {
    type: "dj",
    label: "DJ",
    description: "Get booked, manage gigs, get paid",
    icon: Disc3,
  },
  {
    type: "agency",
    label: "Agency",
    description: "Manage a roster, book artists, handle contracts",
    icon: Users,
  },
  {
    type: "venue_contact",
    label: "Venue",
    description: "Book DJs, manage events, handle payments",
    icon: Building2,
  },
  {
    type: "promoter",
    label: "Promoter",
    description: "Plan events, book talent, manage budgets",
    icon: Megaphone,
  },
];

const DASHBOARD_ROUTES: Record<UserType, string> = {
  dj: "/dashboard",
  agency: "/roster",
  venue_contact: "/dashboard",
  promoter: "/dashboard",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"type" | "details">("type");
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleTypeSelect(type: UserType) {
    setSelectedType(type);
    setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedType) return;

    setError("");
    setLoading(true);

    const result = await createProfile(selectedType, displayName);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(DASHBOARD_ROUTES[selectedType]);
  }

  if (step === "type") {
    return (
      <div className="onboarding">
        <h1 className="onboarding__title">How will you use Clubstack?</h1>
        <p className="onboarding__description">
          Select your role to get started. You can always change this later.
        </p>
        <div className="onboarding__types">
          {USER_TYPES.map((ut) => (
            <button
              key={ut.type}
              type="button"
              className="onboarding__type-card"
              onClick={() => handleTypeSelect(ut.type)}
            >
              <ut.icon size={24} strokeWidth={1.5} />
              <span className="onboarding__type-label">{ut.label}</span>
              <span className="onboarding__type-desc">{ut.description}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const typeConfig = USER_TYPES.find((ut) => ut.type === selectedType);

  return (
    <div className="onboarding">
      <h1 className="onboarding__title">
        Set up your {typeConfig?.label} account
      </h1>
      <p className="onboarding__description">
        Just a few details to get started.
      </p>
      <form onSubmit={handleSubmit} className="onboarding__form">
        <Input
          label={selectedType === "venue_contact" ? "Venue name" : "Name"}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={
            selectedType === "venue_contact"
              ? "e.g. Nowadays"
              : selectedType === "agency"
                ? "e.g. Holt Booking"
                : "Your name"
          }
          required
          error={error}
        />
        <div className="onboarding__actions">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setStep("type");
              setError("");
            }}
          >
            Back
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
