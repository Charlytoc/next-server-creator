import "server-only";
import { NextResponse } from "next/server";
import { createRigoPackage } from "@/utils/rigo";

export async function POST(request: Request) {
  try {
    const { token, slug, config } = await request.json();

    if (!token || !slug || !config) {
      return NextResponse.json(
        { error: "Missing required fields: token, slug, config" },
        { status: 400 }
      );
    }

    const result = await createRigoPackage(token, slug, config);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create Rigo package",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

