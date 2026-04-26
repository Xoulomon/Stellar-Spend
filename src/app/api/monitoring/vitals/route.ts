import { type NextRequest, NextResponse } from "next/server";
import { recordVital } from "@/lib/performance";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, rating, url, ts } = body;
    if (typeof name !== "string" || typeof value !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    recordVital({ name, value, rating: rating ?? "unknown", url: url ?? "/", timestamp: ts ?? Date.now() });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
