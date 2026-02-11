import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true, lastReset: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Double check if reset is needed (fallback to cron)
  const now = new Date();
  const lastReset = new Date(user.lastReset);
  const isDifferentDay = now.toDateString() !== lastReset.toDateString();

  if (isDifferentDay) {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        credits: 50000,
        lastReset: now,
      },
    });
    return NextResponse.json({ credits: updatedUser.credits });
  }

  return NextResponse.json({ credits: user.credits });
}
