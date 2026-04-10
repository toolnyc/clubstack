/**
 * Server-only PDF document for branded booking offers.
 *
 * IMPORTANT: This module imports `@react-pdf/renderer`, which is a heavy
 * server-side library. It MUST NOT be imported from any client component.
 * Only API route handlers and other server-only code should import it.
 */
import "server-only";
import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { DealSummary } from "@/lib/booking/deal-math";

export interface OfferDocumentData {
  agency: {
    name: string;
    location: string | null;
  } | null;
  booking: {
    id: string;
    status: string;
    notes: string | null;
  };
  dates: Array<{
    date: string;
    event_name: string | null;
    set_time: string | null;
    load_in_time: string | null;
  }>;
  artists: Array<{
    name: string;
    fee: number;
    commission_pct: number;
    payment_split_pct: number;
  }>;
  counterparty: {
    label: "Venue" | "Promoter" | "Counterparty";
    name: string | null;
    location: string | null;
  };
  dealSummary: DealSummary;
  generatedAt: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111",
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    paddingBottom: 12,
    marginBottom: 24,
  },
  agencyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  agencyMeta: {
    fontSize: 9,
    color: "#555",
  },
  title: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#555",
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  rowLabel: {
    color: "#555",
  },
  rowValue: {
    fontFamily: "Helvetica-Bold",
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 4,
    padding: 10,
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  tableCell: {
    fontSize: 10,
  },
  col1: { flex: 2 },
  col2: { flex: 1, textAlign: "right" },
  col3: { flex: 1, textAlign: "right" },
  col4: { flex: 1, textAlign: "right" },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsLabel: {
    color: "#555",
  },
  totalsValue: {
    fontFamily: "Helvetica-Bold",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#111",
    paddingTop: 6,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    fontSize: 10,
  },
  grandTotalValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  signatureArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
  },
  signatureBlock: {
    width: "45%",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#111",
    height: 32,
  },
  signatureCaption: {
    fontSize: 8,
    color: "#555",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#888",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    paddingTop: 6,
  },
  notesText: {
    fontSize: 10,
    color: "#333",
    lineHeight: 1.4,
  },
});

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function OfferDocument({ data }: { data: OfferDocumentData }) {
  const { agency, booking, dates, artists, counterparty, dealSummary } = data;

  return (
    <Document
      title={`Offer — ${booking.id.slice(0, 8)}`}
      author={agency?.name ?? "Clubstack"}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.agencyName}>
            {agency?.name ?? "Clubstack Booking"}
          </Text>
          {agency?.location ? (
            <Text style={styles.agencyMeta}>{agency.location}</Text>
          ) : null}
          <Text style={styles.title}>Offer Sheet</Text>
          <Text style={styles.subtitle}>
            Reference: {booking.id.slice(0, 8).toUpperCase()} · Generated{" "}
            {new Date(data.generatedAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{counterparty.label}</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{counterparty.name ?? "TBD"}</Text>
            {counterparty.location ? (
              <Text style={styles.rowLabel}>{counterparty.location}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Event Details</Text>
          {dates.length === 0 ? (
            <Text style={styles.rowLabel}>No dates scheduled</Text>
          ) : (
            dates.map((d, i) => (
              <View key={i} style={styles.card}>
                <Text style={styles.cardTitle}>
                  {d.event_name ?? "Performance"}
                </Text>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Date</Text>
                  <Text style={styles.rowValue}>{d.date}</Text>
                </View>
                {d.set_time ? (
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Set time</Text>
                    <Text style={styles.rowValue}>{d.set_time}</Text>
                  </View>
                ) : null}
                {d.load_in_time ? (
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Load-in</Text>
                    <Text style={styles.rowValue}>{d.load_in_time}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Artist(s) & Fees</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>Artist</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>Fee</Text>
            <Text style={[styles.tableHeaderCell, styles.col3]}>Comm %</Text>
            <Text style={[styles.tableHeaderCell, styles.col4]}>Split %</Text>
          </View>
          {artists.map((a, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>{a.name}</Text>
              <Text style={[styles.tableCell, styles.col2]}>
                {money(a.fee)}
              </Text>
              <Text style={[styles.tableCell, styles.col3]}>
                {a.commission_pct}%
              </Text>
              <Text style={[styles.tableCell, styles.col4]}>
                {a.payment_split_pct}%
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Deal Math</Text>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Gross fees</Text>
            <Text style={styles.totalsValue}>
              {money(dealSummary.grossFees)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Costs</Text>
            <Text style={styles.totalsValue}>
              {money(dealSummary.totalCosts)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Commission</Text>
            <Text style={styles.totalsValue}>
              {money(dealSummary.totalCommission)}
            </Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Net to artist(s)</Text>
            <Text style={styles.totalsValue}>
              {money(dealSummary.totalDueToArtists)}
            </Text>
          </View>
          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total Owed</Text>
            <Text style={styles.grandTotalValue}>
              {money(dealSummary.totalOwed)}
            </Text>
          </View>
        </View>

        {booking.notes ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <View style={styles.card}>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.signatureArea}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureCaption}>
              {agency?.name ?? "Agency"}
            </Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureCaption}>
              {counterparty.name ?? counterparty.label}
            </Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          This is an offer sheet only — not a legally binding contract. Terms to
          be finalized in a signed agreement.
        </Text>
      </Page>
    </Document>
  );
}

/**
 * Render an offer document to a PDF buffer. Server-only.
 */
export async function renderOfferPdf(data: OfferDocumentData): Promise<Buffer> {
  return renderToBuffer(<OfferDocument data={data} />);
}
