import { InvoiceList } from "@/components/invoice/invoice-list";
import { getAllInvoices } from "@/lib/invoice/actions";

export default async function InvoicesPage() {
  const result = await getAllInvoices();
  const invoices = result.data ?? [];

  return (
    <main className="invoices-page">
      <h1 className="invoices-page__title">Invoices</h1>
      <InvoiceList invoices={invoices} />
    </main>
  );
}
