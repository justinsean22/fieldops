import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { Job } from "../../../shared/types";
import { JobDetail } from "../components/JobDetail";

export default function Jobs() {
  const [connected, setConnected] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // NEW: which job is selected for "do stuff" actions
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Derived: selected job object (safe even if jobs list reloads)
  const selectedJob = useMemo(
    () => jobs.find((j) => j.jobId === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  useEffect(() => {
    (async () => {
      try {
        await api.health();
        setConnected(true);
        const list = await api.listJobs();
        setJobs(list);
      } catch {
        setConnected(false);
      }
    })();
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const job = await api.createJob(name.trim());
      setJobs((j) => [job, ...j]);
      setName("");
      // Optional: auto-open the newly created job
      setSelectedJobId(job.jobId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 520, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1>Jobs</h1>

      <div style={{ marginBottom: 12 }}>
        API: {connected ? "Connected ✅" : "Not connected ❌"}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="Customer name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />
        <button
          onClick={create}
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd" }}
        >
          + New
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {jobs.map((j) => {
          const isSelected = j.jobId === selectedJobId;

          return (
            <li
              key={j.jobId}
              onClick={() => setSelectedJobId(j.jobId)}
              style={{
                padding: 12,
                border: isSelected ? "1px solid #888" : "1px solid #eee",
                borderRadius: 12,
                marginBottom: 8,
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 600 }}>{j.customer.name}</div>
              <div style={{ color: "#666", fontSize: 12 }}>
                {new Date(j.createdAt).toLocaleString()} • {j.status}
              </div>
              {isSelected && (
                <div style={{ marginTop: 8, color: "#777", fontSize: 12 }}>
                  Selected
                </div>
              )}
            </li>
          );
        })}

        {jobs.length === 0 && <div>No jobs yet.</div>}
      </ul>

      {/* NEW: the “do stuff after job creation” panel */}
      {selectedJob && (
        <JobDetail
          job={selectedJob}
          onClose={() => setSelectedJobId(null)}
 	/>
      )}
    </div>
  );
}
