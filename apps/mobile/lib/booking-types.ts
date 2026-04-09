/**
 * Deal math types — mirrors the web's deal-math.ts interfaces.
 * Used for API response typing on the mobile side.
 */

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
