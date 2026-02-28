import { useEffect, useState } from "react";
import { Job, Agreement, Receipt, PriceBookSummary } from "../../../shared/types";
import { api } from "../lib/api";
import { AgreementRecorder } from "./AgreementRecorder";
import { ReceiptUploader } from "./ReceiptUploader";

export function JobDetail({
  job,
  onClose,
}: {
  job: Job;
  onClose: () => void;
}) {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [evidenceBusyByAgreement, setEvidenceBusyByAgreement] = useState<Record<string, boolean>>({});

  const [invoices, setInvoices] = useState<any[]>([]);
  const [invBusy, setInvBusy] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [pbQuery, setPbQuery] = useState("");
  const [pbResults, setPbResults] = useState<PriceBookSummary[]>([]);
  const [pbBusy, setPbBusy] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    setLoading(true);
    try {
      const [list, inv, rec] = await Promise.all([
        api.listAgreements(job.jobId),
        api.listInvoices(job.jobId),
        api.listReceipts(job.jobId),
      ]);

      setAgreements(list);
      setInvoices(inv);
      setReceipts(rec);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.jobId]);

  return (
    <div
      style={{
        marginTop: 14,
        padding: 14,
        border: "1px solid #333",
        borderRadius: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{job.customer.name}</div>
          <div style={{ fontSize: 12, color: "#777" }}>
            {new Date(job.createdAt).toLocaleString()} • {job.status}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #555",
            background: "transparent",
            height: 36,
          }}
        >
          Close
        </button>
      </div>

      <AgreementRecorder
        jobId={job.jobId}
        onCreated={(agreement: Agreement) => {
          setAgreements((prev) => [agreement, ...prev]);
        }}
      />

      {/* // NEW BUTTON: This triggers the invoice creation from the latest agreement */}
      <button
        onClick={async () => {
          setInvBusy(true);
          try {
            const inv = await api.createInvoiceFromLatestAgreement(job.jobId);
            setInvoices((prev) => [inv, ...prev]);
          } catch (e: any) {
            alert(e?.message ?? "Failed to create invoice");
          } finally {
            setInvBusy(false);
          }
        }}
        disabled={invBusy}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: 10,
          border: "1px solid #555",
          fontWeight: 700,
          marginTop: 10,
          background: invBusy ? "#222" : "transparent",
          cursor: invBusy ? "not-allowed" : "pointer",
        }}
      >
        {invBusy ? "Creating Invoice…" : "Create Invoice"}
      </button>

      <ReceiptUploader
        jobId={job.jobId}
        onUploaded={(r) => {
          setReceipts((prev) => [r, ...prev]);
        }}
      />

      <div style={{ marginTop: 14, fontWeight: 700 }}>Agreements</div>

      {loading ? (
        <div style={{ color: "#777", marginTop: 8 }}>Loading…</div>
      ) : err ? (
        <div style={{ marginTop: 8 }}>Error: {err}</div>
      ) : agreements.length === 0 ? (
        <div style={{ color: "#777", marginTop: 8 }}>No agreements yet.</div>
      ) : (
        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {agreements.map((a) => (
            <div
              key={a.agreementId}
              style={{
                padding: 12,
                border: "1px solid #222",
                borderRadius: 12,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                Agreement • {new Date(a.createdAt).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                Transcript: {a.transcript ?? "—"}
              </div>
              {a.audioUrl && (
                <audio
                  controls
                  src={a.audioUrl.startsWith("http") ? a.audioUrl : `http://localhost:8000${a.audioUrl}`}
                  style={{ width: "100%", marginTop: 8 }}
                />
              )}

              <button
                onClick={async () => {
                  setEvidenceBusyByAgreement((prev) => ({ ...prev, [a.agreementId]: true }));
                  try {
                    const updated = await api.generateEvidencePdf(job.jobId, a.agreementId);
                    setAgreements((prev) =>
                      prev.map((x) => (x.agreementId === a.agreementId ? updated : x))
                    );
                  } catch (e: any) {
                    alert(e?.message ?? "Failed to generate evidence PDF");
                  } finally {
                    setEvidenceBusyByAgreement((prev) => ({ ...prev, [a.agreementId]: false }));
                  }
                }}
                disabled={!!evidenceBusyByAgreement[a.agreementId]}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 10,
                  border: "1px solid #555",
                  fontWeight: 700,
                  marginTop: 10,
                  opacity: evidenceBusyByAgreement[a.agreementId] ? 0.7 : 1,
                  cursor: evidenceBusyByAgreement[a.agreementId] ? "not-allowed" : "pointer",
                }}
              >
                {evidenceBusyByAgreement[a.agreementId] ? "Generating Evidence PDF…" : "Generate Evidence PDF"}
              </button>

              {a.evidencePdfUrl && (
                <a
                  href={
                    a.evidencePdfUrl.startsWith("http")
                      ? a.evidencePdfUrl
                      : `http://localhost:8000${a.evidencePdfUrl}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block", marginTop: 8, fontSize: 12 }}
                >
                  Open Evidence PDF
                </a>
              )}

              {a.evidenceHash && (
                <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                  Evidence Hash: {a.evidenceHash}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14, fontWeight: 700 }}>Invoices</div>

      {invoices.length === 0 ? (
        <div style={{ color: "#777", marginTop: 8 }}>No invoices yet.</div>
      ) : (
        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {invoices.map((inv) => (
            <div
              key={inv.invoiceId}
              style={{ padding: 12, border: "1px solid #222", borderRadius: 12 }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {inv.invoiceNumber} • {new Date(inv.createdAt).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                Total: ${inv.totals?.total?.toFixed?.(2) ?? inv.totals?.total ?? "—"}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14, fontWeight: 700 }}>Receipts</div>

      {receipts.length === 0 ? (
        <div style={{ color: "#777", marginTop: 8 }}>No receipts yet.</div>
      ) : (
        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {receipts.map((r) => (
            <div
              key={r.receiptId}
              style={{ padding: 12, border: "1px solid #222", borderRadius: 12 }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                Receipt • {new Date(r.createdAt).toLocaleString()}
              </div>
              <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                OCR: {r.ocrStatus}
                {r.storeGuess ? ` • ${r.storeGuess}` : ""}
              </div>

              {r.parsedItems?.length ? (
                <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
                  Parsed items: {r.parsedItems.length}
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 12, color: "#777" }}>
                  No parsed items (OCR may be unavailable).
                </div>
              )}

              <button
                onClick={async () => {
                  await api.importReceiptToPricebook(job.jobId, r.receiptId);
                  alert("Imported to PriceBook");
                }}
                disabled={!r.parsedItems?.length}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: 10,
                  border: "1px solid #555",
                  fontWeight: 700,
                  marginTop: 10,
                  opacity: r.parsedItems?.length ? 1 : 0.5,
                }}
              >
                Import to PriceBook
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14, fontWeight: 700 }}>PriceBook</div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          value={pbQuery}
          onChange={(e) => setPbQuery(e.target.value)}
          placeholder="Search (e.g., 2x4)"
          style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />
        <button
          onClick={async () => {
            setPbBusy(true);
            try {
              const res = await api.searchPricebook(pbQuery);
              setPbResults(res);
            } finally {
              setPbBusy(false);
            }
          }}
          disabled={pbBusy || !pbQuery.trim()}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd" }}
        >
          {pbBusy ? "…" : "Search"}
        </button>
      </div>

      {pbResults.length > 0 && (
        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {pbResults.map((x) => (
            <div
              key={x.itemNormalized}
              style={{ padding: 12, border: "1px solid #222", borderRadius: 12 }}
            >
              <div style={{ fontWeight: 700 }}>{x.itemNormalized}</div>
              <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                Lowest: {x.lowestPaid ?? "—"} • Last: {x.lastPaid ?? "—"}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14, color: "#777", fontSize: 12 }}>
        Next actions (coming): Customer signature + payment flow.
      </div>
    </div>
  );
}
