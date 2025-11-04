# Workflow with Pusher Notifications

This guide explains how to create a complete flow that includes: API endpoint → workflow → Pusher → frontend.

## Architecture Flow

```
API Route → Workflow → Pusher → Frontend (PusherListener)
```

1. The client makes a POST request to an endpoint
2. The endpoint starts a workflow
3. The workflow executes steps that may include business logic
4. When a step needs to notify the frontend, it sends an event to Pusher
5. The PusherListener component in the frontend receives the event and displays it

## Step 1: Create the API Endpoint

Create a file in `app/api/[name]/route.ts`:

```typescript
import { start } from 'workflow/api';
import { yourWorkflowFunction } from "@/workflows/your-workflow";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { data } = await request.json();

  await start(yourWorkflowFunction, [data]);

  return NextResponse.json({
    message: "Workflow started",
  });
}
```

**Features:**
- The endpoint receives data from the client
- Uses `start()` to execute the workflow asynchronously
- Returns immediately without waiting for the workflow to finish

## Step 2: Create the Workflow

Create a file in `workflows/your-workflow.ts`:

```typescript
import { FatalError } from "workflow";
import { sleep } from "workflow";
import Pusher from "pusher";

export async function yourWorkflowFunction(data: string) {
  "use workflow";
  
  const result = await step1(data);
  await step2(result);
  
  await sleep("5s"); // Use sleep to wait without spending resources
  
  await step3WithNotification(result);
  
  return { status: "completed" };
}

async function step1(data: string) {
  "use step";
  
  console.log(`Processing: ${data}`);
  return { id: crypto.randomUUID(), data };
}

async function step2(result: { id: string; data: string }) {
  "use step";
  
  console.log(`Executing step 2 for: ${result.id}`);
  
  if (Math.random() < 0.3) {
    throw new Error("Retryable error");
  }
}

async function step3WithNotification(result: { id: string; data: string }) {
  "use step";
  
  if (!result.data) {
    throw new FatalError("Invalid data");
  }
  
  console.log(`Notifying: ${result.id}`);
  
  const pusher = new Pusher({
    appId: "YOUR_APP_ID",
    key: "YOUR_KEY",
    secret: "YOUR_SECRET",
    cluster: "us2",
    useTLS: true,
  });
  
  await pusher.trigger("my-channel", "my-event", {
    message: `Process completed: ${result.id}`,
    resultId: result.id,
    data: result.data,
    type: "notification",
  });
}
```

**Important concepts:**

### "use workflow"
- Marks the main workflow function
- This function can contain multiple steps and `sleep()` calls
- Executes asynchronously and persistently

### "use step"
- Marks individual functions that execute as steps
- Normal errors are automatically retried
- `FatalError` are not retried
- Can perform any Node.js operations (APIs, databases, etc.)

### Pusher in Steps
- Initialize Pusher inside the step when you need it
- Don't initialize Pusher at the top level of the module (can cause issues)
- Use `pusher.trigger()` to send events

### Error Handling
- `throw new Error()`: Retryable error (automatically retried)
- `throw new FatalError()`: Fatal error (not retried)

### Sleep
- `await sleep("5s")`: Pauses the workflow without consuming resources
- Useful for waiting between steps or implementing delays

## Step 3: Configure Pusher in the Frontend

Create a component `app/components/PusherListener.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import Pusher from "pusher-js";

export default function PusherListener() {
  useEffect(() => {
    Pusher.logToConsole = true;

    const pusher = new Pusher("YOUR_KEY", {
      cluster: "us2",
    });

    const channel = pusher.subscribe("my-channel");

    channel.bind("my-event", function (data: any) {
      alert(JSON.stringify(data));
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

**Notes:**
- Use `pusher-js` in the frontend (not `pusher`)
- The key must be the same as in the workflow
- The channel and event must match the `trigger()` in the workflow

## Step 4: Integrate PusherListener in the Layout

Add the component to the root layout `app/layout.tsx`:

```typescript
import PusherListener from "./components/PusherListener";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PusherListener />
        {children}
      </body>
    </html>
  );
}
```

This makes the listener active on all pages.

## Complete Flow Example

### 1. Client calls the endpoint:
```bash
POST /api/test
Body: { "email": "user@example.com" }
```

### 2. The endpoint starts the workflow:
```typescript
await start(handleUserSignup, ["user@example.com"]);
```

### 3. The workflow executes:
- `createUser()` creates the user
- `sendWelcomeEmail()` sends welcome email
- `sleep("5s")` waits 5 seconds
- `sendOnboardingEmail()` sends event to Pusher

### 4. Pusher receives the event:
```typescript
pusher.trigger("my-channel", "my-event", {
  message: "Onboarding email sent...",
  userId: "...",
  email: "...",
  type: "onboarding_email",
});
```

### 5. Frontend receives the notification:
The `PusherListener` detects the event and displays an alert with the data.

## Dependencies Installation

```bash
# Server (for workflows)
npm install pusher

# Client (for frontend)
npm install pusher-js
```

## Pusher Configuration

1. Create an account at [Pusher](https://pusher.com)
2. Create a new app
3. Get your credentials:
   - `appId`
   - `key` (public, can be used in frontend)
   - `secret` (private, backend only)
   - `cluster`

## Environment Variables (Optional but Recommended)

Create a `.env.local` file:

```env
PUSHER_APP_ID=2073209
PUSHER_KEY=609743b48b8ed073d67f
PUSHER_SECRET=ae0ae03cf538441a9679
PUSHER_CLUSTER=us2
```

Then update your code to use environment variables instead of hardcoded values.

## Best Practices

1. **Never initialize Pusher at the top level of the workflow module**
   - Always inside a step when you need it

2. **Use different channels for different event types**
   - `user-{userId}` for user-specific events
   - `admin-channel` for administrative events
   - `my-channel` for testing

3. **Include useful metadata in events**
   - User IDs, timestamps, event types, etc.

4. **Handle errors appropriately**
   - Use `FatalError` for errors that shouldn't be retried
   - Use normal `Error` for transient errors

5. **Clean up Pusher connections**
   - The `PusherListener` should disconnect when unmounted

## Troubleshooting

**The workflow doesn't execute:**
- Verify the function has `"use workflow"`
- Verify it's exported
- Check server logs

**Pusher doesn't receive events:**
- Verify credentials are correct
- Verify channel and event match
- Check browser console for Pusher logs

**Frontend doesn't receive notifications:**
- Verify `PusherListener` is in the layout
- Verify you're using `pusher-js` (not `pusher`)
- Verify the key is the same on both sides
