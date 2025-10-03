import { z as zod } from "zod";
import { createTRPCRouter, publicProcedure, TRPCError } from "../trpc";
import {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} from "@/server/services/posts";
import { mapErrorToTRPC } from "@/server/utils/errors";
import { StandardErrorCodes } from "@/constants/errors";

export const postsRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      zod
        .object({
          authorId: zod.string().uuid().optional(),
          publishedOnly: zod.boolean().optional(),
          limit: zod.number().int().positive().max(100).optional(),
          page: zod.number().int().positive().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      try {
        return await listPosts(input ?? {});
      } catch (err) {
        throw mapErrorToTRPC(err);
      }
    }),

  byId: publicProcedure
    .input(zod.object({ id: zod.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const post = await getPost(input.id);
        if (!post) {
          throw new TRPCError({
            code: StandardErrorCodes.NOT_FOUND,
            message: "Post not found",
          });
        }
        return post;
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw mapErrorToTRPC(err);
      }
    }),

  create: publicProcedure
    .input(
      zod.object({
        title: zod.string().min(1),
        content: zod.string().min(1),
        authorId: zod.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await createPost(input);
      } catch (err) {
        throw mapErrorToTRPC(err);
      }
    }),

  update: publicProcedure
    .input(
      zod.object({
        id: zod.string().uuid(),
        patch: zod
          .object({
            title: zod.string().min(1).optional(),
            content: zod.string().min(1).optional(),
            published: zod.boolean().optional(),
          })
          .refine((value) => Object.keys(value).length > 0, {
            message: "No fields to update",
          }),
        userId: zod.string().uuid(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await updatePost(input.id, input.patch, input.userId);
      } catch (err) {
        throw mapErrorToTRPC(err);
      }
    }),

  remove: publicProcedure
    .input(zod.object({ id: zod.string().uuid(), userId: zod.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        await deletePost(input.id, input.userId);
        return { success: true } as const;
      } catch (err) {
        throw mapErrorToTRPC(err);
      }
    }),
});
