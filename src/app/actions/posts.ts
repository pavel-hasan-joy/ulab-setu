"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePoster } from "@/lib/auth";
import { postKinds } from "@/lib/site";
import { fail, type FormState } from "./auth";

const postSchema = z.object({
  kind: z.enum(postKinds),
  title: z.string().trim().min(4, "Give the post a short title."),
  body: z.string().trim().min(10, "Add a few words about it."),
  link: z.union([z.literal(""), z.string().trim().url("Links should start with https://")]).optional(),
  eventDate: z.string().optional(),
});

export async function createPost(_: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requirePoster();
  if (user.status !== "APPROVED") return fail("You can post once the alumni office verifies your account.");
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = postSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message, raw);
  const { link, eventDate, ...data } = parsed.data;
  await db.post.create({
    data: { ...data, link: link || null, eventDate: eventDate ? new Date(eventDate) : null, authorId: user.id },
  });
  revalidatePath("/", "layout");
  return { fields: { posted: "1" }, at: Date.now() };
}

export async function deletePost(postId: string) {
  const { user } = await requirePoster();
  await db.post.deleteMany({ where: { id: postId, authorId: user.id } });
  revalidatePath("/", "layout");
}
