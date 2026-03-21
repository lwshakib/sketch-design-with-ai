import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getAndResetCredits } from "@/lib/credits";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const credits = await getAndResetCredits(session.user.id);
    
    return NextResponse.json({ 
      credits, 
      resetAt: "12:00 AM Today" // Just for readability
    });
  } catch (error) {
    console.error("[Credits API] Error:", error);
    return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 });
  }
}
