import { useEffect, useState } from "react";
import { Job, Agreement } from "../../../shared/types";
import { api } from "../lib/api";
import { AgreementRecorder } from "./AgreementRecorder";

export function JobDetail({
  job,
  onClose,
}: {
  job: Job;
  onClose: () => void;
}) {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    setLoading(true);
    try {
      const list = await api.listAgreements(job.jobId);
      setAgreements(list);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load agreements");
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

      {/* Actions (V1: only Agreement Capture wired) */}
      <AgreementRecorder
        jobId={job.jobId}
        onCreated={(agreement: Agreement) => {
          setAgreements((prev) => [agreement, ...prev]);
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
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14, color: "#777", fontSize: 12 }}>
        Next actions (coming): Invoice, Receipt OCR, Evidence PDF.
      </div>
    </div>
  );
}
