import { NextResponse } from "next/server";
import { z as zod } from "zod";
import { listPosts, createPost } from "@/server/services/posts";
import { mapErrorToHttp } from "@/server/utils/errors";
import { getServerAuthSession } from "@/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const pageParam = url.searchParams.get("page");

    const limit = limitParam ? Number(limitParam) : undefined;
    const page = pageParam ? Number(pageParam) : undefined;

    const data = await listPosts({ limit, page });
    return NextResponse.json({ data });
  } catch (err: Error | unknown) {
    const { status, message } = mapErrorToHttp(err);
    return NextResponse.json({ error: { message } }, { status });
  }
}

const createBodySchema = zod.object({
  title: zod.string().min(1),
  content: zod.string().min(1),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsedResponse = createBodySchema.safeParse(json);
    if (!parsedResponse.success) {
      return NextResponse.json(
        { error: { message: "Invalid request body" } },
        { status: 400 }
      );
    }

    const session = await getServerAuthSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: { message: "Authentication required" } },
        { status: 401 }
      );
    }

    const data = await createPost({ ...parsedResponse.data, authorId: userId });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: Error | unknown) {
    const { status, message } = mapErrorToHttp(err);
    return NextResponse.json({ error: { message } }, { status });
  }
}
