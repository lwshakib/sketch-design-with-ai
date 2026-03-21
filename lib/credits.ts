import prisma from "./prisma";
import { startOfDay } from "date-fns";

export const DEFAULT_CREDITS = 10;

/**
 * Gets the current credits for a user, resetting them if it's a new day (12 AM).
 */
export async function getAndResetCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true, lastCreditReset: true },
  });

  if (!user) return 0;

  const now = new Date();
  const lastReset = user.lastCreditReset;
  
  // Reset if last reset was on a different day than today (today's start is > last reset)
  if (startOfDay(now).getTime() > startOfDay(lastReset).getTime()) {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: DEFAULT_CREDITS,
        lastCreditReset: now,
      },
      select: { credits: true },
    });
    return updatedUser.credits;
  }

  return user.credits;
}

/**
 * Consumes 1 credit for a user if they have any left.
 * Returns the new credit count or throws if exhausted.
 */
export async function consumeCredit(userId: string) {
  // First ensure they are reset if needed
  await getAndResetCredits(userId);
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user || user.credits <= 0) {
    throw new Error("CREDITS_EXHAUSTED");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      credits: { decrement: 1 },
    },
    select: { credits: true },
  });

  return updatedUser.credits;
}
