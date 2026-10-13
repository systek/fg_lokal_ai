import type { Claim, ClaimAction, NewClaim } from "./types";

// Relative URLs: the Vite dev server proxies /api to Spring Boot on :8080 (see vite.config.ts).
const BASE = "/api/claims";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    // The backend returns { message } for 400/404/409.
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  listClaims: () => request<Claim[]>(BASE),

  getClaim: (id: number) => request<Claim>(`${BASE}/${id}`),

  createClaim: (claim: NewClaim) =>
    request<Claim>(BASE, { method: "POST", body: JSON.stringify(claim) }),

  performAction: (id: number, action: ClaimAction, actor: string, reason?: string) =>
    request<Claim>(`${BASE}/${id}/${action}`, {
      method: "POST",
      body: JSON.stringify({ actor, reason }),
    }),
};
