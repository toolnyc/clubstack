"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInvoiceStatus } from "@/lib/invoice/actions";
import { Button } from "@/components/ui/button";
import type { InvoiceStatus } from "@/types";

interface InvoiceActionsProps {
  invoiceId: string;
  status: InvoiceStatus;
}

function InvoiceActions({ invoiceId, status }: InvoiceActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStatusUpdate(newStatus: InvoiceStatus) {
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoiceId, newStatus);
      if (!result.error) {
        router.refresh();
      }
    });
  }

  if (status === "draft") {
    return (
      <div className="invoice-view__actions">
        <Button
          variant="primary"
          loading={isPending}
          onClick={() => handleStatusUpdate("sent")}
        >
          Send Invoice
        </Button>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div className="invoice-view__actions">
        <Button
          variant="primary"
          loading={isPending}
          onClick={() => handleStatusUpdate("paid")}
        >
          Mark as Paid
        </Button>
      </div>
    );
  }

  return null;
}

export { InvoiceActions };
export type { InvoiceActionsProps };
