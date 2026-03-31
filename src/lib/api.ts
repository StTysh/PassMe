import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("not_found", message, 404, details);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("conflict", message, 409, details);
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("bad_request", message, 400, details);
  }
}

export class PayloadTooLargeError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("payload_too_large", message, 413, details);
  }
}

export class UnsupportedMediaTypeError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("unsupported_media_type", message, 415, details);
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("unprocessable_entity", message, 422, details);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("rate_limited", message, 429, details);
  }
}

export class UpstreamError extends ApiError {
  constructor(message: string, details?: unknown) {
    super("upstream_failed", message, 502, details);
  }
}

export function ok<T>(payload: T) {
  return NextResponse.json({ ok: true, ...payload });
}

export function fail(code: string, message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );
}

function isRequestBodyParseError(error: unknown) {
  if (error instanceof SyntaxError) {
    return true;
  }

  if (error instanceof TypeError) {
    return /json|form data|formdata|multipart|request body/i.test(error.message);
  }

  return false;
}

export function handleRouteError(error: unknown) {
  if (isRequestBodyParseError(error)) {
    return fail(
      "bad_request",
      "Malformed request body.",
      400,
      error instanceof Error ? error.message : undefined,
    );
  }

  if (error instanceof ApiError) {
    return fail(error.code, error.message, error.status, error.details);
  }

  if (error instanceof ZodError) {
    return fail(
      "bad_request",
      "Request validation failed.",
      400,
      error.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      })),
    );
  }

  if (error instanceof Error) {
    return fail("request_failed", error.message, 500);
  }

  return fail("request_failed", "Unexpected error", 500);
}
