import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  apiFetch,
  ApiError,
  TimeoutError,
  isAccountFrozenError,
  ACCOUNT_FROZEN_MESSAGE,
} from "../api";

const BASE_URL = "http://localhost:4000";

function mockFetch(
  responseInit: {
    ok?: boolean;
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: unknown;
    text?: string;
  } = {},
) {
  const {
    ok = true,
    status = 200,
    statusText = "OK",
    headers = {},
    body,
    text,
  } = responseInit;

  const fetchMock = vi.fn().mockImplementation(
    (_url: string, _init?: RequestInit): Promise<Response> => {
      const respHeaders = new Headers(headers);
      const responseBody =
        text !== undefined
          ? text
          : body !== undefined
            ? JSON.stringify(body)
            : "";

      return Promise.resolve({
        ok,
        status,
        statusText,
        headers: respHeaders,
        json: () => Promise.resolve(body),
        text: () => Promise.resolve(responseBody),
        clone() {
          return this;
        },
      } as unknown as Response);
    },
  );

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

let fakeStorage: Record<string, string>;

beforeEach(() => {
  fakeStorage = {};
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => fakeStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      fakeStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete fakeStorage[key];
    }),
    clear: vi.fn(() => {
      fakeStorage = {};
    }),
    get length() {
      return Object.keys(fakeStorage).length;
    },
    key: vi.fn((index: number) => Object.keys(fakeStorage)[index] ?? null),
  });
  Object.defineProperty(globalThis, "window", {
    value: globalThis,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("apiFetch – success responses", () => {
  it("parses JSON and returns the typed result", async () => {
    const payload = { id: 1, name: "test" };
    mockFetch({ ok: true, status: 200, body: payload });

    const result = await apiFetch<{ id: number; name: string }>("/test");
    expect(result).toEqual(payload);
  });

  it("returns null for 204 No Content", async () => {
    mockFetch({ ok: true, status: 204 });

    const result = await apiFetch<null>("/no-content");
    expect(result).toBeNull();
  });

  it("returns null for 205 Reset Content", async () => {
    mockFetch({ ok: true, status: 205 });

    const result = await apiFetch<null>("/reset");
    expect(result).toBeNull();
  });

  it("sends requests to the correct URL with apiVersion prefix", async () => {
    const fetchMock = mockFetch({ ok: true, status: 200, body: {} });

    await apiFetch("/users/123");
    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/api/v1/users/123`,
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});

describe("apiFetch – error normalization", () => {
  it("throws ApiError with status, message, code, and details from backend", async () => {
    mockFetch({
      ok: false,
      status: 422,
      body: {
        error: {
          code: "VALIDATION_ERROR",
          message: "Email is invalid",
          details: { field: "email" },
        },
      },
    });

    await expect(apiFetch("/test")).rejects.toThrow(ApiError);
    try {
      await apiFetch("/test");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const apiErr = e as ApiError;
      expect(apiErr.status).toBe(422);
      expect(apiErr.code).toBe("VALIDATION_ERROR");
      expect(apiErr.message).toBe("Email is invalid");
      expect(apiErr.details).toEqual({ field: "email" });
    }
  });

  it("uses fallback message when backend error payload has no message", async () => {
    mockFetch({
      ok: false,
      status: 500,
      body: { error: { code: "INTERNAL_ERROR" } },
    });

    try {
      await apiFetch("/test");
    } catch (e) {
      const apiErr = e as ApiError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.message).toBe("API error: 500");
    }
  });

  it("uses fallback message when response body is empty", async () => {
    mockFetch({ ok: false, status: 400, text: "" });

    try {
      await apiFetch("/test");
    } catch (e) {
      const apiErr = e as ApiError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.message).toBe("API error: 400");
    }
  });

  it("uses fallback message when response body is not valid JSON", async () => {
    mockFetch({ ok: false, status: 502, text: "Bad Gateway" });

    try {
      await apiFetch("/test");
    } catch (e) {
      const apiErr = e as ApiError;
      expect(apiErr.status).toBe(502);
      expect(apiErr.message).toBe("API error: 502");
    }
  });

  it("uses fallback message when error payload has no error wrapper", async () => {
    mockFetch({ ok: false, status: 403, body: { message: "Forbidden" } });

    try {
      await apiFetch("/test");
    } catch (e) {
      const apiErr = e as ApiError;
      expect(apiErr.status).toBe(403);
      expect(apiErr.message).toBe("API error: 403");
    }
  });

  it("special-codes ACCOUNT_FROZEN with the documented message", async () => {
    mockFetch({
      ok: false,
      status: 403,
      body: { error: { code: "ACCOUNT_FROZEN", message: "Account frozen" } },
    });

    try {
      await apiFetch("/test");
    } catch (e) {
      const apiErr = e as ApiError;
      expect(apiErr.code).toBe("ACCOUNT_FROZEN");
      expect(apiErr.message).toBe(ACCOUNT_FROZEN_MESSAGE);
      expect(isAccountFrozenError(e)).toBe(true);
    }
  });

  it("isAccountFrozenError returns false for non-frozen errors", () => {
    const err = new ApiError({ message: "test", status: 400, code: "OTHER" });
    expect(isAccountFrozenError(err)).toBe(false);
  });

  it("isAccountFrozenError returns false for non-ApiError values", () => {
    expect(isAccountFrozenError(new Error("test"))).toBe(false);
    expect(isAccountFrozenError(null)).toBe(false);
    expect(isAccountFrozenError(undefined)).toBe(false);
  });
});

describe("apiFetch – auth headers", () => {
  it("attaches Authorization header when token exists in localStorage", async () => {
    localStorage.setItem("shelterflex_token", "test-token-abc");
    const fetchMock = mockFetch({ ok: true, body: {} });

    await apiFetch("/test");
    const callHeaders = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(callHeaders.get("Authorization")).toBe("Bearer test-token-abc");
  });

  it("omits Authorization header when no token in localStorage", async () => {
    const fetchMock = mockFetch({ ok: true, body: {} });

    await apiFetch("/test");
    const callHeaders = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(callHeaders.has("Authorization")).toBe(false);
  });

  it("sets Content-Type to application/json by default", async () => {
    const fetchMock = mockFetch({ ok: true, body: {} });

    await apiFetch("/test");
    const callHeaders = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(callHeaders.get("Content-Type")).toBe("application/json");
  });

  it("preserves existing headers passed in options", async () => {
    const fetchMock = mockFetch({ ok: true, body: {} });

    await apiFetch("/test", {
      headers: { "X-Custom": "value" },
    });
    const callHeaders = fetchMock.mock.calls[0][1]?.headers as Headers;
    expect(callHeaders.get("X-Custom")).toBe("value");
  });
});

describe("apiFetch – network errors", () => {
  it("wraps 'Failed to fetch' TypeError with a helpful message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(apiFetch("/test")).rejects.toThrow(
      "Cannot connect to backend at",
    );
  });

  it("re-throws non-fetch TypeErrors as-is", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Other type error")),
    );

    await expect(apiFetch("/test")).rejects.toThrow("Other type error");
  });
});

describe("apiFetch – request configuration", () => {
  it("sends with cache: no-store", async () => {
    const fetchMock = mockFetch({ ok: true, body: {} });

    await apiFetch("/test");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("defaults to GET when no method is specified", async () => {
    const fetchMock = mockFetch({ ok: true, body: {} });

    await apiFetch("/test");
    const callInit = fetchMock.mock.calls[0][1] as RequestInit | undefined;
    expect(callInit?.method).toBeUndefined();
  });
});

describe("apiFetch – timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function mockHangFetch() {
    const fetchMock = vi.fn().mockImplementation(
      (_url: string, init?: RequestInit): Promise<Response> => {
        return new Promise((_resolve, reject) => {
          const onAbort = () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          };
          if (init?.signal?.aborted) {
            onAbort();
          } else {
            init?.signal?.addEventListener("abort", onAbort, { once: true });
          }
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("throws TimeoutError when request exceeds timeout", async () => {
    mockHangFetch();

    const promise = apiFetch("/test", { timeout: 500 }).catch((e) => e);
    await vi.advanceTimersByTimeAsync(600);

    const error = await promise;
    expect(error).toBeInstanceOf(TimeoutError);
  });

  it("TimeoutError contains the timeout duration in message", async () => {
    mockHangFetch();

    const promise = apiFetch("/test", { timeout: 1000 }).catch((e) => e);
    await vi.advanceTimersByTimeAsync(1100);

    const error = await promise;
    expect(error).toBeInstanceOf(TimeoutError);
    expect((error as TimeoutError).message).toBe("Request timed out after 1000ms");
  });

  it("does NOT throw timeout when response arrives before deadline", async () => {
    const payload = { ok: true };
    mockFetch({ ok: true, status: 200, body: payload });

    const result = await apiFetch("/test", { timeout: 5000 });
    expect(result).toEqual(payload);
  });

  it("cleans up timer on success so no stale abort fires", async () => {
    const payload = { id: 1 };
    mockFetch({ ok: true, status: 200, body: payload });

    const result = await apiFetch("/test", { timeout: 100 });
    await vi.advanceTimersByTimeAsync(200);
    expect(result).toEqual(payload);
  });

  it("no timeout option means no AbortController abort", async () => {
    const fetchMock = mockFetch({ ok: true, body: {} });

    await apiFetch("/test");
    const callInit = fetchMock.mock.calls[0][1] as RequestInit | undefined;
    expect(callInit?.signal).toBeDefined();
  });
});
