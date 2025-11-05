"use client";

import { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function Home() {
  const [agentSessionId, setAgentSessionId] = useState<string>("");
  const [agentMessages, setAgentMessages] = useState<ChatMessage[]>([]);
  const [agentInput, setAgentInput] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!agentSessionId) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || "609743b48b8ed073d67f";
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2";

    Pusher.logToConsole = true;

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const channelName = `agent-${agentSessionId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("agent-message", (data: any) => {
      if (data.role === "user") {
        setAgentMessages((prev) => [
          ...prev,
          {
            role: "user",
            content: data.message,
            timestamp: new Date(),
          },
        ]);
      } else if (data.role === "assistant") {
        setAgentMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
          },
        ]);
        setAgentLoading(false);
      }
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [agentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentMessages]);

  const startAgent = async () => {
    const sessionId = crypto.randomUUID();
    setAgentSessionId(sessionId);
    setAgentMessages([]);
    setAgentLoading(true);

    try {
      const response = await fetch("/api/test-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to start agent");
      }
    } catch (error) {
      console.error("Error starting agent:", error);
      setAgentLoading(false);
    }
  };

  const sendAgentMessage = async () => {
    if (!agentInput.trim() || !agentSessionId || agentLoading) return;

    const message = agentInput.trim();
    setAgentInput("");
    setAgentLoading(true);

    try {
      const response = await fetch("/api/test-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: agentSessionId,
          message,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setAgentLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black py-12">
      <main className="flex flex-col items-center justify-center text-center px-16 max-w-4xl w-full">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50 mb-6">
          Test Agent
        </h1>
        <p className="text-2xl text-zinc-600 dark:text-zinc-400 mb-12">
          Chat with an AI agent powered by OpenAI
        </p>

        <div className="w-full">
          {!agentSessionId ? (
            <button
              onClick={startAgent}
              className="w-full px-6 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              Start Chat Session
            </button>
          ) : (
            <div className="flex flex-col h-[600px] border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {agentMessages.length === 0 && (
                  <div className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                    Chat started! Send a message to begin.
                  </div>
                )}
                {agentMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-50"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          msg.role === "user"
                            ? "text-blue-100"
                            : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {agentLoading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-200 dark:bg-zinc-800 rounded-lg p-3">
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        Thinking...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-zinc-300 dark:border-zinc-700 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={agentInput}
                    onChange={(e) => setAgentInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendAgentMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    disabled={agentLoading}
                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50"
                  />
                  <button
                    onClick={sendAgentMessage}
                    disabled={agentLoading || !agentInput.trim()}
                    className="px-6 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
