import { defineHook } from "workflow";
import { FatalError } from "workflow";
import OpenAI from "openai";

export const messageHook = defineHook<{ text: string; userId?: string }>();

async function callOpenAI(messages: Array<{ role: "user" | "assistant"; content: string }>) {
  "use step";

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new FatalError("OPENAI_API_KEY environment variable is not set");
  }

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  });

  return completion.choices[0]?.message?.content || "";
}

async function sendNotification(
  sessionId: string,
  type: string,
  message: string,
  role: "user" | "assistant"
) {
  "use step";

  const Pusher = (await import("pusher")).default;
  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID || "2073209",
    key: process.env.PUSHER_KEY || "609743b48b8ed073d67f",
    secret: process.env.PUSHER_SECRET || "ae0ae03cf538441a9679",
    cluster: process.env.PUSHER_CLUSTER || "us2",
    useTLS: true,
  });

  await pusher.trigger(`agent-${sessionId}`, "agent-message", {
    type,
    message,
    role,
    sessionId,
  });
}

export async function testAgent(sessionId: string, initialMessage?: string) {
  "use workflow";

  let messages: Array<{ role: "user" | "assistant"; content: string }> = [];

  if (initialMessage) {
    messages.push({ role: "user", content: initialMessage });
    await sendNotification(sessionId, "user_message", initialMessage, "user");
  }

  const userMessages = messageHook.create({ token: `agent-${sessionId}` });

  for await (const userMessage of userMessages) {
    messages.push({ role: "user", content: userMessage.text });
    await sendNotification(
      sessionId,
      "user_message",
      userMessage.text,
      "user"
    );

    const assistantResponse = await callOpenAI(messages);
    messages.push({ role: "assistant", content: assistantResponse });

    await sendNotification(
      sessionId,
      "assistant_message",
      assistantResponse,
      "assistant"
    );
  }

  return {
    status: "completed",
    sessionId,
    messageCount: messages.length,
  };
}

