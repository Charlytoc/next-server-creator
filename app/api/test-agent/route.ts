import "server-only";
import { start } from "workflow/api";
import { testAgent } from "@/workflows/test-agent-workflow";
import { messageHook } from "@/workflows/test-agent-workflow";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { sessionId, message } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 }
      );
    }

    if (message) {
      await messageHook.resume(`agent-${sessionId}`, { text: message });
      return NextResponse.json({
        message: "Message sent to agent",
        sessionId,
      });
    } else {
      await start(testAgent, [sessionId, undefined]);
      return NextResponse.json({
        message: "Agent workflow started",
        sessionId,
      });
    }
  } catch (error) {1
    console.error("Error in test-agent endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to start/send message to agent",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

