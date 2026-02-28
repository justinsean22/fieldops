import { API_BASE_URL } from "./config";
import { Job } from "../../../shared/types";
import type { Agreement } from "../../../shared/types";

import { ApiError } from "../../../shared/errors";

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json().catch(() => undefined) : undefined;

  if (!res.ok) {
    throw new ApiError(
      (payload && (payload as any).detail) || `Request failed (${res.status})`,
      res.status,
      payload
    );
  }
  return payload as T;
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),

  listJobs: () => request<Job[]>("/jobs"),

  createJob: (name: string) =>
    request<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify({ customer: { name } }),
    }),

   listAgreements: (jobId: string) => request<Agreement[]>(`/jobs/${jobId}/agreements`),

   createAgreement: async (jobId: string, audioBlob: Blob): Promise<Agreement> => {
      const url = `${API_BASE_URL}/jobs/${jobId}/agreements`;
    const form = new FormData();
    form.append("audio", audioBlob, "agreement.webm");

    const res = await fetch(url, { method: "POST", body: form });
    const payload = await res.json().catch(() => undefined);

    if (!res.ok) throw new Error((payload && payload.detail) || `Request failed (${res.status})`);
    return payload as Agreement;
  },       
};	


