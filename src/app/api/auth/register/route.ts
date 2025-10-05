import { NextResponse } from "next/server";
import { z as zod } from "zod";
import bcrypt from "bcrypt";
import { createUser, getUserByEmail } from "@/server/services/users";
import { HttpStatusCodes } from "@/constants/http";
import { mapErrorToHttp } from "@/server/utils/errors";

const bodySchema = zod.object({
  email: zod.email(),
  password: zod.string().min(6),
  name: zod.string().min(1).optional(),
});

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { message: "Invalid request body" } },
        { status: HttpStatusCodes.BAD_REQUEST }
      );
    }
    const { email, password, name } = parsed.data;

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: { message: "Email already registered" } },
        { status: HttpStatusCodes.BAD_REQUEST }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, name, passwordHash });
    return NextResponse.json(
      { data: { id: user.id, email: user.email, name: user.name } },
      { status: 201 }
    );
  } catch (err: Error | unknown) {
    const { status, message } = mapErrorToHttp(err);
    return NextResponse.json({ error: { message } }, { status });
  }
}
