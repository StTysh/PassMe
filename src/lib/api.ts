import { NextResponse } from "next/server";

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

export function handleRouteError(error: unknown) {
  if (error instanceof Error) {
    return fail("request_failed", error.message, 400);
  }

  return fail("request_failed", "Unexpected error", 500);
}
