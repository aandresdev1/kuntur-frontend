import { loadTokens } from "./auth";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  { body, auth = true, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const finalHeaders = new Headers(headers);
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body !== undefined && !isFormData && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (auth) {
    const tokens = loadTokens();
    if (tokens?.access_token) {
      finalHeaders.set("Authorization", `Bearer ${tokens.access_token}`);
    }
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : isFormData
          ? (body as FormData)
          : JSON.stringify(body),
  });

  const raw = await res.text();
  const parsed = raw ? safeJson(raw) : null;

  if (!res.ok) {
    const message = extractMessage(parsed) ?? res.statusText;
    throw new ApiError(res.status, message, parsed);
  }

  return parsed as T;
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function extractMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const anyBody = body as { message?: unknown };
  if (typeof anyBody.message === "string") return anyBody.message;
  if (Array.isArray(anyBody.message) && anyBody.message.length > 0) {
    return String(anyBody.message[0]);
  }
  return null;
}
