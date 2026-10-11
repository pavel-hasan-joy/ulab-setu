"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { postKinds } from "@/lib/site";
import { fail, type FormState } from "./auth";

/** Admin verifies or changes status of any user */
export async function setAdminUserStatus(
  userId: string,
  status: "APPROVED" | "PENDING" | "REJECTED"
) {
  const currentAdmin = await requireUser("ADMIN");
  if (currentAdmin.id === userId && status !== "APPROVED") {
    throw new Error("You cannot change your own admin account status.");
  }
  await db.user.update({
    where: { id: userId },
    data: { status },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/analytics");
}

/** Admin changes user role (e.g. promote to Admin, make Teacher, Alumni, Student) */
export async function changeUserRole(
  userId: string,
  role: "STUDENT" | "ALUMNI" | "TEACHER" | "ADMIN"
) {
  const currentAdmin = await requireUser("ADMIN");
  if (currentAdmin.id === userId && role !== "ADMIN") {
    throw new Error("You cannot remove your own admin privileges.");
  }
  await db.user.update({
    where: { id: userId },
    data: { role },
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/analytics");
}

/** Admin permanently deletes a user */
export async function deleteUserByAdmin(userId: string) {
  const currentAdmin = await requireUser("ADMIN");
  if (currentAdmin.id === userId) {
    throw new Error("You cannot delete your own admin account.");
  }
  await db.user.delete({
    where: { id: userId },
  });
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/analytics");
}

/** Admin toggles job active state */
export async function toggleJobStatusByAdmin(jobId: string) {
  await requireUser("ADMIN");
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job) return;
  await db.job.update({
    where: { id: jobId },
    data: { active: !job.active },
  });
  revalidatePath("/admin/jobs");
}

/** Admin deletes a job listing */
export async function deleteJobByAdmin(jobId: string) {
  await requireUser("ADMIN");
  await db.job.delete({
    where: { id: jobId },
  });
  revalidatePath("/admin/jobs");
}

const adminNoticeSchema = z.object({
  kind: z.enum(postKinds),
  title: z.string().trim().min(3, "Title must be at least 3 characters."),
  body: z.string().trim().min(5, "Body must be at least 5 characters."),
  link: z
    .union([z.literal(""), z.string().trim().url("Link must start with https://")])
    .optional(),
  eventDate: z.string().optional(),
});

/** Admin publishes an official university notice / event / scholarship */
export async function createAdminNotice(
  _: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireUser("ADMIN");
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = adminNoticeSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error.issues[0].message, raw);

  const { link, eventDate, ...data } = parsed.data;
  await db.post.create({
    data: {
      ...data,
      link: link || null,
      eventDate: eventDate ? new Date(eventDate) : null,
      authorId: admin.id,
    },
  });

  revalidatePath("/admin/notices");
  revalidatePath("/", "layout");
  return { fields: { posted: "1" }, at: Date.now() };
}

/** Admin deletes any community or official notice/post */
export async function deleteNoticeByAdmin(postId: string) {
  await requireUser("ADMIN");
  await db.post.delete({
    where: { id: postId },
  });
  revalidatePath("/admin/notices");
  revalidatePath("/", "layout");
}

export type ImportDirectoryResult = {
  success: boolean;
  message: string;
  totalParsed: number;
  imported: number;
  autoApprovedCount: number;
};

/**
 * Admin uploads Excel (.xlsx, .xls) or CSV file containing faculty/alumni records.
 * Records are added to PreApprovedMember table and any matching PENDING users are auto-approved instantly.
 */
export async function importDirectoryMembers(
  _: any,
  formData: FormData
): Promise<ImportDirectoryResult> {
  const XLSX = await import("xlsx");
  await requireUser("ADMIN");
  const file = formData.get("file") as File | null;
  const defaultRole = (formData.get("defaultRole") as string) || "AUTO";

  if (!file || file.size === 0) {
    return {
      success: false,
      message: "Please choose an Excel (.xlsx, .xls) or CSV file.",
      totalParsed: 0,
      imported: 0,
      autoApprovedCount: 0,
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName || !workbook.Sheets[sheetName]) {
      return {
        success: false,
        message: "The uploaded file does not contain any readable sheets.",
        totalParsed: 0,
        imported: 0,
        autoApprovedCount: 0,
      };
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[sheetName]);
    if (!rows || rows.length === 0) {
      return {
        success: false,
        message: "The uploaded spreadsheet does not contain any data rows.",
        totalParsed: 0,
        imported: 0,
        autoApprovedCount: 0,
      };
    }

    const findVal = (row: Record<string, any>, patterns: string[]) => {
      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const p of patterns) {
          if (cleanKey.includes(p)) {
            const val = row[key];
            return val !== undefined && val !== null ? String(val).trim() : null;
          }
        }
      }
      return null;
    };

    let importedCount = 0;

    for (const row of rows) {
      const name = findVal(row, ["fullname", "name"]);
      const email = findVal(row, ["email", "mail"])?.toLowerCase() || null;
      const studentId = findVal(row, ["studentid", "idnumber", "idno", "student", "id"]) || null;
      const rawRole = findVal(row, ["role", "type", "category", "usertype"]);

      let role = "ALUMNI";
      if (defaultRole === "TEACHER") {
        role = "TEACHER";
      } else if (defaultRole === "ALUMNI") {
        role = "ALUMNI";
      } else if (rawRole) {
        const r = rawRole.toUpperCase();
        if (r.includes("TEACH") || r.includes("FACULT") || r.includes("PROF")) {
          role = "TEACHER";
        } else {
          role = "ALUMNI";
        }
      }

      const department = findVal(row, ["department", "dept"]);
      const designation = findVal(row, ["designation", "position", "title", "rank"]);
      const graduationYear = findVal(row, ["graduationyear", "gradyear", "passingyear", "year"]);
      const batch = findVal(row, ["batch"]);

      // Require at least email or studentId to identify the person
      if (!email && !studentId) continue;

      const orConditions: Array<{ email?: string; studentId?: string }> = [];
      if (email) orConditions.push({ email });
      if (studentId) orConditions.push({ studentId });

      const existing = await db.preApprovedMember.findFirst({
        where: {
          role,
          OR: orConditions,
        },
      });

      if (existing) {
        await db.preApprovedMember.update({
          where: { id: existing.id },
          data: {
            name: name || existing.name,
            email: email || existing.email,
            studentId: studentId || existing.studentId,
            department: department || existing.department,
            designation: designation || existing.designation,
            graduationYear: graduationYear || existing.graduationYear,
            batch: batch || existing.batch,
            sourceFile: file.name,
          },
        });
      } else {
        await db.preApprovedMember.create({
          data: {
            name,
            email,
            studentId,
            role,
            department,
            designation,
            graduationYear,
            batch,
            sourceFile: file.name,
          },
        });
      }
      importedCount++;
    }

    // Auto-approve existing PENDING users that match the pre-approved directory
    let autoApprovedCount = 0;
    const pendingUsers = await db.user.findMany({
      where: {
        role: { in: ["ALUMNI", "TEACHER"] },
        status: "PENDING",
      },
      select: { id: true, email: true, studentId: true, role: true },
    });

    for (const pending of pendingUsers) {
      const matchConditions: Array<{ email?: string; studentId?: string }> = [];
      if (pending.email) matchConditions.push({ email: pending.email.toLowerCase() });
      if (pending.studentId) matchConditions.push({ studentId: pending.studentId });

      if (matchConditions.length > 0) {
        const isMatched = await db.preApprovedMember.findFirst({
          where: {
            role: pending.role,
            OR: matchConditions,
          },
        });

        if (isMatched) {
          await db.user.update({
            where: { id: pending.id },
            data: { status: "APPROVED" },
          });
          autoApprovedCount++;
        }
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/users");
    revalidatePath("/admin/analytics");

    return {
      success: true,
      message: `Successfully processed ${importedCount} verified member records. ${autoApprovedCount} pending users were automatically approved.`,
      totalParsed: rows.length,
      imported: importedCount,
      autoApprovedCount,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to parse uploaded file.",
      totalParsed: 0,
      imported: 0,
      autoApprovedCount: 0,
    };
  }
}

/** Admin deletes all records in pre-approved directory */
export async function clearPreApprovedDirectory() {
  await requireUser("ADMIN");
  await db.preApprovedMember.deleteMany({});
  revalidatePath("/admin");
  revalidatePath("/admin/users");
}

