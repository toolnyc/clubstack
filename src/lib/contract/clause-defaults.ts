import type { ClauseType } from "@/types";

interface ClauseDefault {
  type: ClauseType;
  title: string;
  content: string;
}

export const DEFAULT_CLAUSES: ClauseDefault[] = [
  {
    type: "parties",
    title: "Parties & Event Details",
    content:
      "This agreement is entered into between the Artist and the Payer (as identified in the booking details) for the performance(s) listed in the attached schedule.",
  },
  {
    type: "compensation",
    title: "Compensation & Payment Terms",
    content:
      "The Payer agrees to pay the Artist the guaranteed fee as specified in the deal summary. A deposit of 50% of the total fee is due upon signing this contract. The remaining balance is due on or before the day of the event. All payments are processed through Clubstack's secure payment system.",
  },
  {
    type: "cancellation",
    title: "Cancellation Protection",
    content:
      "Cancellation by Payer:\n• 30+ days before event: Deposit is forfeited, remaining balance is waived.\n• 14–30 days before event: 50–75% of the total fee is owed.\n• Less than 14 days before event: 100% of the total fee is owed.\n\nCancellation by Artist:\n• Artist will make reasonable efforts to find a replacement of comparable quality.\n• If no replacement is found, any deposit received will be refunded.",
  },
  {
    type: "rider",
    title: "Technical Rider",
    content:
      "The attached Technical Rider (Exhibit A) is incorporated into this agreement by reference. The Payer agrees to provide all equipment, accommodations, and requirements listed therein. Failure to meet rider requirements does not relieve the Payer of payment obligations.",
  },
  {
    type: "force_majeure",
    title: "Force Majeure",
    content:
      "Neither party shall be liable for failure to perform due to circumstances beyond reasonable control, including but not limited to: acts of God, natural disasters, government orders, pandemic-related restrictions, travel bans, venue closures, or extreme weather events. In such cases, the parties shall negotiate in good faith to reschedule or refund as appropriate.",
  },
  {
    type: "pay_or_play",
    title: "Pay-or-Play",
    content:
      "If the Artist arrives at the venue ready and able to perform and the event is cancelled by the Payer for any reason not covered by Force Majeure, the full fee as specified in the deal summary remains owed to the Artist.",
  },
  {
    type: "recording_rights",
    title: "Recording & Broadcasting Rights",
    content:
      "No audio or video recording, livestreaming, or broadcasting of the Artist's performance shall occur without prior written consent from the Artist or their authorized representative. This includes but is not limited to: professional recordings, social media livestreams, and radio broadcasts.",
  },
  {
    type: "independent_contractor",
    title: "Independent Contractor Status",
    content:
      "The Artist is an independent contractor and not an employee of the Payer. The Artist retains full control over the manner and means of their performance. The Artist is responsible for their own tax obligations and insurance.",
  },
  {
    type: "modifications",
    title: "Modifications",
    content:
      "Any modifications to this agreement must be made in writing and signed by both parties. Verbal agreements or informal communications do not constitute binding modifications to this contract.",
  },
];

export function getDefaultClauses(): ClauseDefault[] {
  return DEFAULT_CLAUSES.map((c) => ({ ...c }));
}
