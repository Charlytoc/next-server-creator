import "server-only";
import { NextResponse } from "next/server";
import { getBucket, uploadFileToBucket } from "@/utils/storage";

export async function POST(request: Request) {
  try {
    const { path, content } = await request.json();

    if (!path || content === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: path, content" },
        { status: 400 }
      );
    }

    const bucket = getBucket();
    await uploadFileToBucket(bucket, content, path);

    return NextResponse.json({ success: true, path });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

