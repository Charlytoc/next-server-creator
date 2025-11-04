import { FatalError } from "workflow"
import { sleep } from "workflow";
import Pusher from "pusher";

export async function handleUserSignup(email: string) {
  "use workflow";
  
  const user = await createUser(email);
  await sendWelcomeEmail(user);
  
  await sleep("5s");
  await sendOnboardingEmail(user);
  
  return { userId: user.id, status: "onboarded" };
}
// Our workflow function defined earlier

async function createUser(email: string) {
  "use step"; 
  
  console.log(`Creating user with email: ${email}`);
  
  // Full Node.js access - database calls, APIs, etc.
  return { id: crypto.randomUUID(), email };
}

async function sendWelcomeEmail(user: { id: string; email: string; }) {
  "use step"; 
  
  console.log(`Sending welcome email to user: ${user.id}`);
  
  if (Math.random() < 0.3) {
    // By default, steps will be retried for unhandled errors
    throw new Error("Retryable!");
  }
}

async function sendOnboardingEmail(user: { id: string; email: string}) {        
  "use step";
  
  if (!user.email.includes("@")) {
    throw new FatalError("Invalid Email");
  }
  
  console.log(`Sending onboarding email to user: ${user.id}`);
  
  const pusher = new Pusher({
    appId: "2073209",
    key: "609743b48b8ed073d67f",
    secret: "ae0ae03cf538441a9679",
    cluster: "us2",
    useTLS: true,
  });

  await pusher.trigger("my-channel", "my-event", {
    message: `Onboarding email sent to user: ${user.id} (${user.email})`,       
    userId: user.id,
    email: user.email,
    type: "onboarding_email",
  });
}