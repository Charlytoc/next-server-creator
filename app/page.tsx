"use client";

import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("test@example.com");

  const testEndpoint = async () => {
    setLoading(true);
    setResult("");
    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-col items-center justify-center text-center px-16 max-w-4xl w-full">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50 mb-6">
          We are building the future of education...
        </h1>
        <p className="text-2xl text-zinc-600 dark:text-zinc-400 mb-12">
          Are you ready to learn?
        </p>
        
        <div className="w-full max-w-md space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left">
              Email:
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              placeholder="test@example.com"
            />
          </div>
          <button
            onClick={testEndpoint}
            disabled={loading}
            className="w-full px-6 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Testing..." : "Test API Endpoint"}
          </button>
          
          {result && (
            <div className="w-full mt-4">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left block mb-2">
                Response:
              </label>
              <pre className="w-full p-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-sm text-left overflow-auto max-h-96">
                {result}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
