import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { AppError } from "@/lib/errors";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonError(error: unknown) {
  const payload = errorResponse(error);
  const status = error instanceof AppError ? error.status : 500;
  return NextResponse.json(payload, { status });
}
