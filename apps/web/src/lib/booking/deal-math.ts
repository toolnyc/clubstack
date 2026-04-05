import { round2 } from "@/lib/math";

interface ArtistDeal {
  fee: number;
  commission_pct: number;
  payment_split_pct: number;
}

interface CostItem {
  amount: number;
}

export interface ArtistBreakdown {
  fee: number;
  splitFee: number;
  commission: number;
  netToArtist: number;
  netToBooker: number;
}

export interface DealSummary {
  grossFees: number;
  totalCosts: number;
  totalCommission: number;
  totalDueToArtists: number;
  totalDueToBooker: number;
  totalOwed: number;
  artists: ArtistBreakdown[];
}

export function calculateArtistBreakdown(artist: ArtistDeal): ArtistBreakdown {
  const splitFee = (artist.fee * artist.payment_split_pct) / 100;
  const commission = (splitFee * artist.commission_pct) / 100;
  const netToArtist = splitFee - commission;
  const netToBooker = commission;

  return {
    fee: artist.fee,
    splitFee: round2(splitFee),
    commission: round2(commission),
    netToArtist: round2(netToArtist),
    netToBooker: round2(netToBooker),
  };
}

export function calculateDealSummary(
  artists: ArtistDeal[],
  costs: CostItem[]
): DealSummary {
  const breakdowns = artists.map(calculateArtistBreakdown);
  const grossFees = breakdowns.reduce((sum, a) => sum + a.splitFee, 0);
  const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0);
  const totalCommission = breakdowns.reduce((sum, a) => sum + a.commission, 0);
  const totalDueToArtists = breakdowns.reduce(
    (sum, a) => sum + a.netToArtist,
    0
  );
  const totalDueToBooker = breakdowns.reduce(
    (sum, a) => sum + a.netToBooker,
    0
  );
  const totalOwed = grossFees + totalCosts;

  return {
    grossFees: round2(grossFees),
    totalCosts: round2(totalCosts),
    totalCommission: round2(totalCommission),
    totalDueToArtists: round2(totalDueToArtists),
    totalDueToBooker: round2(totalDueToBooker),
    totalOwed: round2(totalOwed),
    artists: breakdowns,
  };
}
