import "server-only";
import { NextResponse } from "next/server";
import Pusher from "pusher";

export async function POST(request: Request) {
  try {
    const { channel, event, data } = await request.json();

    if (!channel || !event || !data) {
      return NextResponse.json(
        { error: "Missing required fields: channel, event, data" },
        { status: 400 }
      );
    }

    const pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID || "2073209",
      key: process.env.PUSHER_KEY || "609743b48b8ed073d67f",
      secret: process.env.PUSHER_SECRET || "ae0ae03cf538441a9679",
      cluster: process.env.PUSHER_CLUSTER || "us2",
      useTLS: true,
    });

    await pusher.trigger(channel, event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to send notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

