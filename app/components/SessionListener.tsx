"use client";

import { useState, useEffect, useRef } from "react";
import Pusher from "pusher-js";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: string;
}

export default function SessionListener() {
  const [sessionId, setSessionId] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!isListening || !sessionId) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || "609743b48b8ed073d67f";
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2";

    Pusher.logToConsole = true;

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const channelName = `agent-${sessionId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("agent-message", (data: any) => {
      setMessages((prev) => [
        ...prev,
        {
          role: data.role,
          content: data.message,
          timestamp: new Date(),
          type: data.type,
        },
      ]);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [isListening, sessionId]);

  const startListening = () => {
    if (!sessionId.trim()) return;
    setIsListening(true);
    setMessages([]);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  return (
    <div className="w-full space-y-4">
      <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4 text-left">
        Session Listener (Test with Postman)
      </h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          placeholder="Enter session ID..."
          disabled={isListening}
          className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50"
        />
        {!isListening ? (
          <button
            onClick={startListening}
            disabled={!sessionId.trim()}
            className="px-6 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Listening
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="px-6 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
          >
            Stop Listening
          </button>
        )}
      </div>

      {isListening && (
        <div className="flex flex-col h-[500px] border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900">
          <div className="border-b border-zinc-300 dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-800">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Listening to: <span className="font-mono font-semibold">{sessionId}</span>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Channel: <span className="font-mono">agent-{sessionId}</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-zinc-500 dark:text-zinc-400 py-8">
                Waiting for messages... Send messages via Postman to see them here.
              </div>
            )}
            {messages.map((msg, index) => (
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
                  {msg.type && (
                    <div className="text-xs opacity-75 mb-1">{msg.type}</div>
                  )}
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
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}

