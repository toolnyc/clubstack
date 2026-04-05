"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateInvoice } from "@/lib/invoice/actions";
import { Button } from "@/components/ui/button";

interface GenerateInvoiceButtonProps {
  bookingId: string;
}

function GenerateInvoiceButton({ bookingId }: GenerateInvoiceButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateInvoice(bookingId);
      if (result.invoiceId) {
        router.push(`/invoices/${result.invoiceId}`);
      }
    });
  }

  return (
    <Button variant="primary" loading={isPending} onClick={handleGenerate}>
      Generate Invoice
    </Button>
  );
}

export { GenerateInvoiceButton };
export type { GenerateInvoiceButtonProps };
