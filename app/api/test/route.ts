import { start } from 'workflow/api';
import { handleUserSignup } from "@/workflows/test-workflow";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
 const { email } = await request.json();

 // Executes asynchronously and doesn't block your app
 await start(handleUserSignup, [email]);

 return NextResponse.json({
  message: "User signup workflow started",
 });
}