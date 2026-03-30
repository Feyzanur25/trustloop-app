import { config } from "../lib/config";

export class HttpError extends Error {
  constructor(message, statusCode, data = null) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

export async function http(path, init) {
  try {
    const res = await fetch(`${config.apiBaseUrl}${path}`, {
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
    });

    let data = null;
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const errorMessage = data?.error || `HTTP ${res.status}`;
      console.error(`[HTTP ${res.status}] ${path}:`, errorMessage);
      throw new HttpError(errorMessage, res.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    // Network error or timeout
    console.error(`[Network Error] ${path}:`, error.message);
    throw new HttpError(`Network error: ${error.message}`, 0, error);
  }
}
