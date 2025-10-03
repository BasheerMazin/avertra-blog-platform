import { initTRPC, TRPCError } from "@trpc/server";

export type TRPCContext = {
  userId: string | null;
};

export async function createTRPCContext(): Promise<TRPCContext> {
  return { userId: null };
}

const t = initTRPC.context<TRPCContext>().create();

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export { TRPCError };
