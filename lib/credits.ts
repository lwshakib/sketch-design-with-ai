import prisma from "./prisma";

/**
 * Deducts credits from a user and records the usage.
 * @param userId The ID of the user
 * @param amount The amount of credits to deduct
 */
export async function recordCreditUsage(userId: string, amount: number) {
  // Credits disabled
  return await prisma.user.findUnique({ where: { id: userId } });
}
