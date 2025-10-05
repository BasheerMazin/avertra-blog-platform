import { NextRequest, NextResponse } from "next/server";
import { z as zod } from "zod";
import { getPost, updatePost, deletePost } from "@/server/services/posts";
import { HttpStatusCodes } from "@/constants/http";
import { mapErrorToHttp } from "@/server/utils/errors";
import { getServerAuthSession } from "@/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const post = await getPost(id);
    if (!post) {
      return NextResponse.json(
        { error: { message: "Not found" } },
        { status: HttpStatusCodes.NOT_FOUND }
      );
    }
    return NextResponse.json({ data: post });
  } catch (err: Error | unknown) {
    const { status, message } = mapErrorToHttp(err);
    return NextResponse.json({ error: { message } }, { status });
  }
}

const patchSchema = zod
  .object({
    title: zod.string().min(1).optional(),
    content: zod.string().min(1).optional(),
    published: zod.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No fields to update",
  });

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const json = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid request body" } },
        { status: HttpStatusCodes.BAD_REQUEST }
      );
    }

    const session = await getServerAuthSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { message: "Authentication required" } },
        { status: HttpStatusCodes.UNAUTHORIZED }
      );
    }

    const updated = await updatePost(id, parsed.data, userId);
    return NextResponse.json({ data: updated });
  } catch (err: Error | unknown) {
    const { status, message } = mapErrorToHttp(err);
    return NextResponse.json({ error: { message } }, { status });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const session = await getServerAuthSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { message: "Authentication required" } },
        { status: HttpStatusCodes.UNAUTHORIZED }
      );
    }
    await deletePost(id, userId);
    return NextResponse.json({ data: { success: true } });
  } catch (err: Error | unknown) {
    const { status, message } = mapErrorToHttp(err);
    return NextResponse.json({ error: { message } }, { status });
  }
}
