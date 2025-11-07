# Pusher Integration Guide

This guide explains how to integrate Pusher for real-time communication between the backend and frontend in this Next.js application.

## Current Credentials

The following Pusher credentials are currently configured in the project:

- **App ID**: `2073209`
- **Key**: `609743b48b8ed073d67f`
- **Secret**: `ae0ae03cf538441a9679`
- **Cluster**: `us2`

## Prerequisites

Install the required packages:

```bash
npm install pusher pusher-js
```

The project already includes:
- `pusher` (^5.2.0) - For server-side usage
- `pusher-js` (^8.4.0) - For client-side usage

## Environment Variables

Create a `.env.local` file in the `new-creator` directory with the following variables:

```env
# Pusher Configuration (Server-side)
# These are used in workflows/server-side code
PUSHER_APP_ID=2073209
PUSHER_KEY=609743b48b8ed073d67f
PUSHER_SECRET=ae0ae03cf538441a9679
PUSHER_CLUSTER=us2

# Pusher Configuration (Client-side)
# These are exposed to the browser and used in React components
# Note: NEXT_PUBLIC_ prefix makes these available in the browser
NEXT_PUBLIC_PUSHER_KEY=609743b48b8ed073d67f
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

**Important Security Note**: 
- Server-side variables (`PUSHER_SECRET`) should NEVER be exposed to the client
- Only `NEXT_PUBLIC_*` variables are accessible in the browser
- The `PUSHER_KEY` can be safely exposed (it's public), but the `PUSHER_SECRET` must remain server-only

## Backend Integration

### 1. API Route Integration

Create a Next.js API route to send Pusher events. Example from `app/api/internal/notify/route.ts`:

```typescript
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
```

**Usage**: Send a POST request to `/api/internal/notify` with:
```json
{
  "channel": "my-channel",
  "event": "my-event",
  "data": { "message": "Hello from backend!" }
}
```

### 2. Workflow Integration

When using Pusher in workflows, initialize it inside a step (not at the top level). Example from `workflows/test-agent-workflow.ts`:

```typescript
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
```

**Important**: 
- Always initialize Pusher inside a step function, not at the module level
- Use dynamic import: `const Pusher = (await import("pusher")).default;`
- This prevents issues with workflow execution

## Frontend Integration

### 1. Basic Pusher Listener Component

Create a React component to listen for Pusher events. Example from `app/components/PusherListener.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import Pusher from "pusher-js";

export default function PusherListener() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    Pusher.logToConsole = true;

    const pusher = new Pusher(
      process.env.NEXT_PUBLIC_PUSHER_KEY || "609743b48b8ed073d67f",
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2",
      }
    );

    const channel = pusher.subscribe("my-channel");
    channel.bind("my-event", function (data: any) {
      console.log("Received event:", data);
      // Handle the event data
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, []);

  return null;
}
```

### 2. Session-Based Listener

For listening to session-specific channels, use a component like `app/components/SessionListener.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import Pusher from "pusher-js";

export default function SessionListener() {
  const [sessionId, setSessionId] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);

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

  // Component JSX...
}
```

### 3. Adding PusherListener to Layout

Add the PusherListener component to your root layout to enable global event listening:

```typescript
import PusherListener from "./components/PusherListener";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PusherListener />
        {children}
      </body>
    </html>
  );
}
```

## Channel Naming Conventions

Use consistent channel naming patterns:

- **User-specific channels**: `user-{userId}` or `agent-{sessionId}`
- **Public channels**: `my-channel`, `notifications`, `updates`
- **Private channels**: `private-{userId}` (requires authentication)
- **Presence channels**: `presence-{roomId}` (requires authentication)

## Best Practices

### 1. Security

- **Never expose `PUSHER_SECRET`** to the client
- Use `NEXT_PUBLIC_*` prefix only for variables that should be accessible in the browser
- Validate channel names and event data on the server side
- Use private/presence channels for sensitive data

### 2. Initialization

- **Backend**: Initialize Pusher inside functions/steps, not at module level
- **Frontend**: Initialize Pusher inside `useEffect` hooks
- Always clean up connections in cleanup functions

### 3. Error Handling

```typescript
channel.bind("my-event", (data) => {
  try {
    // Handle event
  } catch (error) {
    console.error("Error handling Pusher event:", error);
  }
});
```

### 4. Connection Management

- Always disconnect Pusher when components unmount
- Unbind all event handlers before unsubscribing
- Handle connection errors gracefully

```typescript
useEffect(() => {
  const pusher = new Pusher(key, { cluster });
  
  // ... setup code ...

  return () => {
    channel.unbind_all();
    channel.unsubscribe();
    pusher.disconnect();
  };
}, []);
```

### 5. Debugging

Enable Pusher logging during development:

```typescript
Pusher.logToConsole = true;
```

Remove or set to `false` in production.

## Testing

### Test Backend to Frontend Communication

1. **Start your Next.js server**:
   ```bash
   npm run dev
   ```

2. **Send a test event via API**:
   ```bash
   curl -X POST http://localhost:3000/api/internal/notify \
     -H "Content-Type: application/json" \
     -d '{
       "channel": "my-channel",
       "event": "my-event",
       "data": {"message": "Test message"}
     }'
   ```

3. **Verify in browser console**: You should see the event logged if `Pusher.logToConsole = true`

### Test Workflow Integration

1. **Trigger a workflow** that sends Pusher events
2. **Listen to the channel** in your frontend component
3. **Verify events** are received in real-time

## Troubleshooting

### Events Not Received

1. **Check credentials**: Verify environment variables are set correctly
2. **Verify channel names**: Channel names must match exactly (case-sensitive)
3. **Check event names**: Event names must match exactly
4. **Browser console**: Check for Pusher connection errors
5. **Network tab**: Verify WebSocket connection is established

### Connection Issues

1. **Cluster mismatch**: Ensure cluster matches in both backend and frontend
2. **TLS**: Ensure `useTLS: true` is set in backend configuration
3. **Firewall**: Check if WebSocket connections are blocked
4. **Pusher dashboard**: Check Pusher dashboard for connection status

### Frontend Not Updating

1. **Component not mounted**: Ensure PusherListener is in the layout
2. **Wrong package**: Use `pusher-js` in frontend, not `pusher`
3. **Environment variables**: Verify `NEXT_PUBLIC_*` variables are set
4. **Cleanup**: Ensure previous connections are properly cleaned up

### Workflow Issues

1. **Import error**: Use dynamic import: `const Pusher = (await import("pusher")).default;`
2. **Module level init**: Never initialize Pusher at module level in workflows
3. **Step function**: Always initialize inside a step function

## Example: Complete Flow

### Backend (API Route)

```typescript
// app/api/send-message/route.ts
import "server-only";
import { NextResponse } from "next/server";
import Pusher from "pusher";

export async function POST(request: Request) {
  const { userId, message } = await request.json();
  
  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
  });

  await pusher.trigger(`user-${userId}`, "new-message", {
    message,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
```

### Frontend (React Component)

```typescript
// app/components/MessageListener.tsx
"use client";

import { useEffect, useState } from "react";
import Pusher from "pusher-js";

export default function MessageListener({ userId }: { userId: string }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const pusher = new Pusher(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! }
    );

    const channel = pusher.subscribe(`user-${userId}`);
    
    channel.bind("new-message", (data: any) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [userId]);

  return (
    <div>
      {messages.map((msg, i) => (
        <div key={i}>{msg.message}</div>
      ))}
    </div>
  );
}
```

## Additional Resources

- [Pusher Documentation](https://pusher.com/docs)
- [Pusher JavaScript Client](https://github.com/pusher/pusher-js)
- [Pusher Node.js Server](https://github.com/pusher/pusher-http-node)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## Summary

- **Backend**: Use `pusher` package, initialize inside functions/steps
- **Frontend**: Use `pusher-js` package, initialize in `useEffect`
- **Credentials**: Store in `.env.local`, use `NEXT_PUBLIC_*` for client-side
- **Channels**: Use consistent naming conventions
- **Cleanup**: Always disconnect and unbind in cleanup functions
- **Security**: Never expose `PUSHER_SECRET` to the client

