import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/auth/actions";
import { getInvoice } from "@/lib/invoice/actions";
import { InvoiceDetail } from "@/components/invoice/invoice-detail";
import { TopBar } from "@/components/layout/top-bar";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const { id } = await params;
  const data = await getInvoice(id);

  if (!data) {
    return (
      <>
        <TopBar title="Invoice" />
        <main className="invoice-detail-page">
          <Link href="/invoices" className="invoice-detail-page__back">
            &larr; Back to Invoices
          </Link>
          <p className="invoice-detail-page__not-found">Invoice not found.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar title="Invoice" />
      <main className="invoice-detail-page">
        <Link href="/invoices" className="invoice-detail-page__back">
          &larr; Back to Invoices
        </Link>
        <InvoiceDetail invoice={data.invoice} lineItems={data.lineItems} />
      </main>
    </>
  );
}
