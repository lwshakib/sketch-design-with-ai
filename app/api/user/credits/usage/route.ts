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

  // Fetch usage for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const usage = await prisma.creditUsage.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: sevenDaysAgo,
      },
    },
    orderBy: {
      date: "asc",
    },
    select: {
      amount: true,
      date: true,
    },
  });

  // Format data for the chart
  const formattedUsage = usage.map((u) => ({
    date: new Date(u.date).toLocaleDateString("en-US", { weekday: "short" }),
    credits: u.amount,
  }));

  return NextResponse.json({ usage: formattedUsage });
}
