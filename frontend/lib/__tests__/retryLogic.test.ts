import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { retryWithBackoff, withRetry } from "../retryLogic";

describe("retryWithBackoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns result on first successful attempt", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await retryWithBackoff(fn, { maxRetries: 3 });
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on retryable status code and succeeds", async () => {
    const err = Object.assign(new Error("500"), { status: 500 });
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValue("recovered");

    const promise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2,
      retryableStatusCodes: [500],
    });

    // Allow the first call to fail, then advance past the retry delay
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;
    expect(result).toBe("recovered");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on network error (TypeError with 'fetch')", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue("ok");

    const promise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
    });
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry on non-retryable status code (400)", async () => {
    const err = Object.assign(new Error("400"), { status: 400 });
    const fn = vi.fn().mockRejectedValue(err);

    await expect(
      retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 100,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      }),
    ).rejects.toThrow("400");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry on 401 Unauthorized", async () => {
    const err = Object.assign(new Error("401"), { status: 401 });
    const fn = vi.fn().mockRejectedValue(err);

    await expect(
      retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 100,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      }),
    ).rejects.toThrow("401");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry on 403 Forbidden", async () => {
    const err = Object.assign(new Error("403"), { status: 403 });
    const fn = vi.fn().mockRejectedValue(err);

    await expect(
      retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 100,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      }),
    ).rejects.toThrow("403");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry on 404 Not Found", async () => {
    const err = Object.assign(new Error("404"), { status: 404 });
    const fn = vi.fn().mockRejectedValue(err);

    await expect(
      retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 100,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
      }),
    ).rejects.toThrow("404");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("DOES retry on 429 Too Many Requests", async () => {
    const err = Object.assign(new Error("429"), { status: 429 });
    const fn = vi
      .fn()
      .mockRejectedValueOnce(err)
      .mockRejectedValueOnce(err)
      .mockResolvedValue("ok");

    const promise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2,
      retryableStatusCodes: [429],
    });
    await vi.advanceTimersByTimeAsync(500);
    const result = await promise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("exhausts all retries and throws the last error", async () => {
    const err = Object.assign(new Error("503"), { status: 503 });
    const fn = vi.fn().mockRejectedValue(err);

    const promise = retryWithBackoff(fn, {
      maxRetries: 2,
      initialDelayMs: 100,
      backoffMultiplier: 2,
      retryableStatusCodes: [503],
    });

    let caughtError: unknown;
    promise.catch((e) => {
      caughtError = e;
    });

    await vi.advanceTimersByTimeAsync(1000);
    await promise.catch(() => {});
    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toBe("503");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("calls onRetry callback with attempt number and error", async () => {
    const err = Object.assign(new Error("502"), { status: 502 });
    const fn = vi.fn().mockRejectedValueOnce(err).mockResolvedValue("ok");
    const onRetry = vi.fn();

    const promise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2,
      retryableStatusCodes: [502],
      onRetry,
    });
    await vi.advanceTimersByTimeAsync(200);
    await promise;
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ message: "502" }),
    );
  });

  it("does NOT retry on non-Error thrown values", async () => {
    const fn = vi.fn().mockRejectedValue("string error");

    await expect(
      retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 100,
        retryableStatusCodes: [500],
      }),
    ).rejects.toThrow("string error");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does NOT retry on TimeoutError", async () => {
    const timeoutErr = Object.assign(new Error("Request timed out after 500ms"), {
      name: "TimeoutError",
    });
    const fn = vi.fn().mockRejectedValue(timeoutErr);

    await expect(
      retryWithBackoff(fn, {
        maxRetries: 3,
        initialDelayMs: 100,
        retryableStatusCodes: [408, 500, 502, 503, 504],
      }),
    ).rejects.toThrow("Request timed out after 500ms");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("caps delay at maxDelayMs", async () => {
    const err = Object.assign(new Error("500"), { status: 500 });
    const fn = vi
      .fn()
      .mockRejectedValueOnce(err)
      .mockRejectedValueOnce(err)
      .mockRejectedValueOnce(err)
      .mockResolvedValue("ok");

    const promise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 2000,
      backoffMultiplier: 10,
      retryableStatusCodes: [500],
    });

    // Even with multiplier=10, delay should be capped at maxDelayMs + 25% jitter
    await vi.advanceTimersByTimeAsync(2000 * 1.3);
    await vi.advanceTimersByTimeAsync(2000 * 1.3);
    await vi.advanceTimersByTimeAsync(2000 * 1.3);
    const result = await promise;
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(4);
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a wrapped function that retries on failure", async () => {
    const err = Object.assign(new Error("500"), { status: 500 });
    const original = vi.fn().mockRejectedValueOnce(err).mockResolvedValue("done");

    const wrapped = withRetry(original, {
      maxRetries: 2,
      initialDelayMs: 100,
      retryableStatusCodes: [500],
    });

    const promise = wrapped("arg1");
    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;
    expect(result).toBe("done");
    expect(original).toHaveBeenCalledWith("arg1");
    expect(original).toHaveBeenCalledTimes(2);
  });
});
