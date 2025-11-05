"use client";

import { useEffect, useState } from "react";
import Pusher from "pusher-js";
import { PusherNotification } from "@/types/tutorial";

interface NotificationState extends PusherNotification {
  id: string;
  timestamp: Date;
}

export default function PusherListener() {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);

  useEffect(() => {
    Pusher.logToConsole = true;

    const pusher = new Pusher(
      process.env.NEXT_PUBLIC_PUSHER_KEY || "609743b48b8ed073d67f",
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
      }
    );

    const handleTutorialCreation = (data: PusherNotification) => {
      const notification: NotificationState = {
        ...data,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };
      setNotifications((prev) => [notification, ...prev].slice(0, 50));
    };

    const myChannel = pusher.subscribe("my-channel");
    myChannel.bind("my-event", function (data: any) {
      alert(JSON.stringify(data));
    });

    return () => {
      myChannel.unbind_all();
      myChannel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg border ${
            notification.status === "COMPLETED"
              ? "bg-green-50 border-green-200 text-green-800"
              : notification.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-semibold text-sm">{notification.type}</div>
              <div className="text-sm mt-1">{notification.message}</div>
              {notification.lesson && (
                <div className="text-xs mt-1 opacity-75">
                  Lesson: {notification.lesson}
                </div>
              )}
              <div className="text-xs mt-1 opacity-50">
                {notification.timestamp.toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={() =>
                setNotifications((prev) =>
                  prev.filter((n) => n.id !== notification.id)
                )
              }
              className="ml-2 text-xs opacity-50 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
