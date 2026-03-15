"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SignatureType } from "@/types";

interface SignaturePadProps {
  onSign: (data: string, type: SignatureType) => void;
  loading?: boolean;
}

function SignaturePad({ onSign, loading = false }: SignaturePadProps) {
  const [mode, setMode] = useState<SignatureType>("typed");
  const [typedName, setTypedName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = "var(--text-primary, #000)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function endDraw() {
    isDrawing.current = false;
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function handleSubmit() {
    if (mode === "typed") {
      if (!typedName.trim()) return;
      onSign(typedName.trim(), "typed");
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const data = canvas.toDataURL("image/png");
      onSign(data, "drawn");
    }
  }

  return (
    <div className="signature-pad">
      <div className="signature-pad__tabs">
        <button
          type="button"
          className={`signature-pad__tab ${mode === "typed" ? "signature-pad__tab--active" : ""}`}
          onClick={() => setMode("typed")}
        >
          Type
        </button>
        <button
          type="button"
          className={`signature-pad__tab ${mode === "drawn" ? "signature-pad__tab--active" : ""}`}
          onClick={() => setMode("drawn")}
        >
          Draw
        </button>
      </div>

      {mode === "typed" ? (
        <div className="signature-pad__typed">
          <Input
            label="Full name"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Your legal name"
            required
          />
          {typedName && (
            <div
              className="signature-pad__preview"
              aria-label="Signature preview"
            >
              {typedName}
            </div>
          )}
        </div>
      ) : (
        <div className="signature-pad__drawn">
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            className="signature-pad__canvas"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            aria-label="Draw your signature"
          />
          <Button variant="ghost" size="sm" onClick={clearCanvas}>
            Clear
          </Button>
        </div>
      )}

      <div className="signature-pad__actions">
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={mode === "typed" && !typedName.trim()}
        >
          Sign contract
        </Button>
      </div>

      <p className="signature-pad__legal">
        By signing, you agree that this electronic signature has the same legal
        effect as a handwritten signature.
      </p>
    </div>
  );
}

export { SignaturePad };
export type { SignaturePadProps };
