import { useRef, useState } from "react";
import { api } from "../lib/api";

export function AgreementRecorder({
  jobId,
  onCreated,
}: {
  jobId: string;
  onCreated: (agreement: any) => void;
}) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const start = async () => {
    setErr(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];

    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = async () => {
      // stop mic
      stream.getTracks().forEach((t) => t.stop());

      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      setBusy(true);
      try {
        const agreement = await api.createAgreement(jobId, blob);
        onCreated(agreement);
      } catch (e: any) {
        setErr(e?.message ?? "Upload failed");
      } finally {
        setBusy(false);
      }
    };

    mediaRecorderRef.current = mr;
    mr.start();
    setRecording(true);
  };

  const stop = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div style={{ padding: 12, border: "1px solid #333", borderRadius: 12, marginTop: 10 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Agreement Capture</div>

      {err && <div style={{ marginBottom: 8 }}>Error: {err}</div>}

      <button
        onClick={recording ? stop : start}
        disabled={busy}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid #555",
          fontWeight: 700,
        }}
      >
        {busy ? "Uploading…" : recording ? "Stop Recording" : "Start Recording"}
      </button>
    </div>
  );
}
