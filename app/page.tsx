"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";

interface Notification {
  type: string;
  message: string;
  lesson?: string;
  status?: string;
  courseSlug: string;
  timestamp: Date;
}

export default function Home() {
  const [testResult, setTestResult] = useState<string>("");
  const [testLoading, setTestLoading] = useState(false);
  const [testEmail, setTestEmail] = useState("test@example.com");

  const [tutorialResult, setTutorialResult] = useState<string>("");
  const [tutorialLoading, setTutorialLoading] = useState(false);
  const [rigoToken, setRigoToken] = useState("");
  const [bcToken, setBcToken] = useState("");
  const [courseSlug, setCourseSlug] = useState("");
  const [syllabusJson, setSyllabusJson] = useState("");
  const [tutorialNotifications, setTutorialNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || "609743b48b8ed073d67f";
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2";

    Pusher.logToConsole = true;

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const subscribeToChannel = (channelName: string) => {
      const channel = pusher.subscribe(channelName);
      channel.bind("tutorial-creation", (data: any) => {
        setTutorialNotifications((prev) => [
          {
            ...data,
            timestamp: new Date(),
          },
          ...prev,
        ].slice(0, 20));
      });
    };

    if (courseSlug) {
      subscribeToChannel(`tutorial-${courseSlug}`);
    }

    return () => {
      pusher.disconnect();
    };
  }, [courseSlug]);

  const testEndpoint = async () => {
    setTestLoading(true);
    setTestResult("");
    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: testEmail }),
      });
      const data = await response.json();
      setTestResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResult(
        JSON.stringify(
          { error: error instanceof Error ? error.message : "Unknown error" },
          null,
          2
        )
      );
    } finally {
      setTestLoading(false);
    }
  };

  const createTutorial = async () => {
    setTutorialLoading(true);
    setTutorialResult("");
    setTutorialNotifications([]);

    try {
      let syllabus;
      if (syllabusJson.trim()) {
        syllabus = JSON.parse(syllabusJson);
      } else {
        syllabus = {
          courseInfo: {
            slug: courseSlug || "test-tutorial",
            title: "Test Tutorial",
            description: "A test tutorial",
            language: "en",
            technologies: [],
            duration: 30,
            hasContentIndex: false,
            difficulty: "beginner",
            contentIndex: "",
            isCompleted: false,
            variables: [],
            currentStep: "hasContentIndex",
            purpose: "learnpack-lesson-writer",
          },
          lessons: [
            {
              id: "1",
              uid: "1",
              title: "Introduction",
              type: "READ",
              description: "Introduction to the tutorial",
            },
          ],
        };
      }

      const response = await fetch("/api/create-tutorial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rigo-token": rigoToken,
          "x-breathecode-token": bcToken,
        },
        body: JSON.stringify({ syllabus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create tutorial");
      }

      setTutorialResult(JSON.stringify(data, null, 2));
      setCourseSlug(data.courseSlug || syllabus.courseInfo.slug);
    } catch (error) {
      setTutorialResult(
        JSON.stringify(
          { error: error instanceof Error ? error.message : "Unknown error" },
          null,
          2
        )
      );
    } finally {
      setTutorialLoading(false);
    }
  };

  const sampleSyllabus = {
    courseInfo: {
      slug: "my-test-tutorial",
      title: "My Test Tutorial",
      description: "This is a test tutorial created via the API",
      language: "en",
      technologies: ["javascript", "react"],
      duration: 60,
      hasContentIndex: false,
      difficulty: "beginner" as const,
      contentIndex: "",
      isCompleted: false,
      variables: [],
      currentStep: "hasContentIndex",
      purpose: "learnpack-lesson-writer",
    },
    lessons: [
      {
        id: "1",
        uid: "1",
        title: "Getting Started",
        type: "READ" as const,
        description: "Learn the basics",
      },
      {
        id: "2",
        uid: "2",
        title: "First Exercise",
        type: "CODE" as const,
        description: "Complete your first exercise",
      },
    ],
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black py-12">
      <main className="flex flex-col items-center justify-center text-center px-16 max-w-6xl w-full">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-black dark:text-zinc-50 mb-6">
          We are building the future of education...
        </h1>
        <p className="text-2xl text-zinc-600 dark:text-zinc-400 mb-12">
          Are you ready to learn?
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
          <div className="w-full space-y-4">
            <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4 text-left">
              Test Workflow
            </h2>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left"
              >
                Email:
              </label>
              <input
                id="email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                placeholder="test@example.com"
              />
            </div>
            <button
              onClick={testEndpoint}
              disabled={testLoading}
              className="w-full px-6 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testLoading ? "Testing..." : "Test API Endpoint"}
            </button>

            {testResult && (
              <div className="w-full mt-4">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left block mb-2">
                  Response:
                </label>
                <pre className="w-full p-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-sm text-left overflow-auto max-h-96">
                  {testResult}
                </pre>
              </div>
            )}
          </div>

          <div className="w-full space-y-4">
            <h2 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-4 text-left">
              Create Tutorial
            </h2>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="rigo-token"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left"
              >
                Rigo Token (x-rigo-token):
              </label>
              <input
                id="rigo-token"
                type="text"
                value={rigoToken}
                onChange={(e) => setRigoToken(e.target.value)}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                placeholder="Enter Rigo token"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="bc-token"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left"
              >
                Breathecode Token (x-breathecode-token):
              </label>
              <input
                id="bc-token"
                type="text"
                value={bcToken}
                onChange={(e) => setBcToken(e.target.value)}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                placeholder="Enter Breathecode token"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="course-slug"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left"
              >
                Course Slug (optional):
              </label>
              <input
                id="course-slug"
                type="text"
                value={courseSlug}
                onChange={(e) => setCourseSlug(e.target.value)}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                placeholder="my-tutorial-slug"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="syllabus-json"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left"
              >
                Syllabus JSON (optional):
              </label>
              <textarea
                id="syllabus-json"
                value={syllabusJson}
                onChange={(e) => setSyllabusJson(e.target.value)}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 min-h-32 font-mono text-sm"
                placeholder={JSON.stringify(sampleSyllabus, null, 2)}
              />
              <button
                onClick={() => setSyllabusJson(JSON.stringify(sampleSyllabus, null, 2))}
                className="text-xs text-blue-600 dark:text-blue-400 text-left"
              >
                Use sample syllabus
              </button>
            </div>

            <button
              onClick={createTutorial}
              disabled={tutorialLoading || !rigoToken || !bcToken}
              className="w-full px-6 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tutorialLoading ? "Creating Tutorial..." : "Create Tutorial"}
            </button>

            {tutorialResult && (
              <div className="w-full mt-4">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left block mb-2">
                  Response:
                </label>
                <pre className="w-full p-4 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-sm text-left overflow-auto max-h-96">
                  {tutorialResult}
                </pre>
              </div>
            )}

            {tutorialNotifications.length > 0 && (
              <div className="w-full mt-4">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 text-left block mb-2">
                  Workflow Notifications:
                </label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tutorialNotifications.map((notification, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border text-sm ${
                        notification.status === "COMPLETED"
                          ? "bg-green-50 border-green-200 text-green-800"
                          : notification.type === "error"
                          ? "bg-red-50 border-red-200 text-red-800"
                          : "bg-blue-50 border-blue-200 text-blue-800"
                      }`}
                    >
                      <div className="font-semibold">{notification.type}</div>
                      <div className="mt-1">{notification.message}</div>
                      {notification.lesson && (
                        <div className="text-xs mt-1 opacity-75">
                          Lesson: {notification.lesson}
                        </div>
                      )}
                      <div className="text-xs mt-1 opacity-50">
                        {notification.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
