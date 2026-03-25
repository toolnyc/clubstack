import { InvoiceList } from "@/components/invoice/invoice-list";
import { getAllInvoices } from "@/lib/invoice/actions";
import { TopBar } from "@/components/layout/top-bar";

export default async function InvoicesPage() {
  const result = await getAllInvoices();
  const invoices = result.data ?? [];

  return (
    <>
      <TopBar title="Invoices" />
      <main className="flex flex-col gap-6 p-6">
        <InvoiceList invoices={invoices} />
      </main>
    </>
  );
}
