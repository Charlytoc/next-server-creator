import { start } from "workflow/api";
import { createTutorial } from "@/workflows/create-tutorial-workflow";
import { NextResponse } from "next/server";
import { CreateTutorialRequest, Syllabus } from "@/types/tutorial";

export async function POST(request: Request) {
  try {
    const body: CreateTutorialRequest = await request.json();
    const { syllabus } = body;

    const rigoToken = request.headers.get("x-rigo-token");
    const bcToken = request.headers.get("x-breathecode-token");

    if (!rigoToken || !bcToken) {
      return NextResponse.json(
        { error: "Missing tokens. Both x-rigo-token and x-breathecode-token are required." },
        { status: 400 }
      );
    }

    if (!syllabus) {
      return NextResponse.json(
        { error: "Missing syllabus in request body" },
        { status: 400 }
      );
    }

    if (!syllabus.courseInfo) {
      return NextResponse.json(
        { error: "Missing courseInfo in syllabus" },
        { status: 400 }
      );
    }

    if (!syllabus.lessons || !Array.isArray(syllabus.lessons) || syllabus.lessons.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty lessons array in syllabus" },
        { status: 400 }
      );
    }

    if (!syllabus.courseInfo.slug) {
      return NextResponse.json(
        { error: "Missing slug in courseInfo" },
        { status: 400 }
      );
    }

    await start(createTutorial, [syllabus, rigoToken, bcToken]);

    return NextResponse.json({
      message: "Tutorial creation workflow started",
      courseSlug: syllabus.courseInfo.slug,
    });
  } catch (error) {
    console.error("Error starting tutorial creation workflow:", error);
    return NextResponse.json(
      {
        error: "Failed to start tutorial creation workflow",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

