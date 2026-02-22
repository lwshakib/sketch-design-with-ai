import { Inngest } from "inngest";
import { realtimeMiddleware } from "@inngest/realtime/middleware";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "sketch-design-with-ai",
  middleware: [realtimeMiddleware()],
  // On Production
  eventKey: process.env.INNGEST_EVENT_KEY,
});
