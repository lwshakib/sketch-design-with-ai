import prisma from "./prisma";

/**
 * Deducts credits from a user and records the usage.
 * @param userId The ID of the user
 * @param amount The amount of credits to deduct
 */
export async function recordCreditUsage(userId: string, amount: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return await prisma.$transaction(async (tx) => {
    // Check current credits
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!currentUser || currentUser.credits < 10000) {
      throw new Error(`Insufficient credits: 10,000 credits required to generate. You have ${currentUser?.credits ?? 0}.`);
    }

    // Deduct credits from user
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        credits: {
          decrement: amount,
        },
      },
    });

    // Record usage for the day
    await tx.creditUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        amount: amount,
        date: today,
      },
      update: {
        amount: {
          increment: amount,
        },
      },
    });

    return user;
  });
}
