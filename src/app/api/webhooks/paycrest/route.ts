import { NextResponse } from "next/server";

// TODO: handle Paycrest webhook events
export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
