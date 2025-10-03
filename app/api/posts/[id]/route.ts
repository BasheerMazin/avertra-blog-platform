import { NextResponse } from "next/server";
import { z as zod } from "zod";
import { getPost, updatePost, deletePost } from "@/server/services/posts";
import { HttpStatusCodes } from "@/constants/http";
import { mapErrorToHttp } from "@/server/utils/errors";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    const post = await getPost(id);
    if (!post) {
      return NextResponse.json(
        { error: { message: "Not found" } },
        { status: HttpStatusCodes.NOT_FOUND }
      );
    }
    return NextResponse.json({ data: post });
  } catch (e) {
    const { status, message } = mapErrorToHttp(e);
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

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    const json = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid request body" } },
        { status: HttpStatusCodes.BAD_REQUEST }
      );
    }

    // Auth placeholder
    const userId = null as string | null;
    if (!userId) {
      return NextResponse.json(
        { error: { message: "Authentication required" } },
        { status: HttpStatusCodes.FORBIDDEN }
      );
    }

    const updated = await updatePost(id, parsed.data, userId);
    return NextResponse.json({ data: updated });
  } catch (e) {
    const { status, message } = mapErrorToHttp(e);
    return NextResponse.json({ error: { message } }, { status });
  }
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  try {
    const id = ctx.params.id;
    // Auth placeholder
    const userId = null as string | null;
    if (!userId) {
      return NextResponse.json(
        { error: { message: "Authentication required" } },
        { status: HttpStatusCodes.FORBIDDEN }
      );
    }
    await deletePost(id, userId);
    return NextResponse.json({ data: { success: true } });
  } catch (e) {
    const { status, message } = mapErrorToHttp(e);
    return NextResponse.json({ error: { message } }, { status });
  }
}
