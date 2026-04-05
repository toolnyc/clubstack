"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importRosterCSV } from "@/lib/agency/actions";

interface CSVImportProps {
  onClose?: () => void;
}

function CSVImport({ onClose }: CSVImportProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    { email: string; result: string }[] | null
  >(null);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");
    setResults(null);

    const text = await file.text();
    const res = await importRosterCSV(text);

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setResults(res.results ?? []);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="csv-import">
      <p className="csv-import__instructions">
        Upload a CSV with an <code>email</code> column. Optional:{" "}
        <code>commission</code> column (defaults to 15%).
      </p>

      <label className="csv-import__dropzone">
        <Upload size={20} strokeWidth={1.5} />
        <span>{loading ? "Importing..." : "Choose CSV file"}</span>
        <input
          type="file"
          accept=".csv"
          onChange={handleFile}
          disabled={loading}
          className="csv-import__input"
        />
      </label>

      {error && <p className="csv-import__error">{error}</p>}

      {results && (
        <div className="csv-import__results">
          <p className="csv-import__results-title">Import results:</p>
          {results.map((r, i) => (
            <div key={i} className="csv-import__result-row">
              <span className="csv-import__result-email">{r.email}</span>
              <span
                className={`csv-import__result-status ${r.result === "invited" ? "csv-import__result-status--ok" : ""}`}
              >
                {r.result}
              </span>
            </div>
          ))}
        </div>
      )}

      {onClose && (
        <div className="csv-import__actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}

export { CSVImport };
export type { CSVImportProps };
