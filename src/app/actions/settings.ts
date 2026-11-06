"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminPermission } from "@/lib/admin-auth";
import { SYSTEM_SETTING_DEFINITIONS, type SettingCategory } from "@/lib/settings";

/**
 * Persist modified system configuration parameters to the database with admin auditing.
 */
export async function saveSystemSettings(formData: { settings: Record<string, string> }) {
  const { user } = await requireAdminPermission("settings:manage");
  const { settings } = formData;

  if (!settings || typeof settings !== "object") {
    return { success: false, error: "Invalid settings payload provided." };
  }

  const updatedKeys: string[] = [];

  for (const [key, value] of Object.entries(settings)) {
    const def = SYSTEM_SETTING_DEFINITIONS.find((d) => d.key === key);
    if (!def) continue;

    // Validate type
    let sanitizedVal = String(value ?? "").trim();
    if (def.type === "boolean") {
      sanitizedVal = sanitizedVal === "true" ? "true" : "false";
    } else if (def.type === "number") {
      const num = parseInt(sanitizedVal, 10);
      sanitizedVal = isNaN(num) ? def.defaultValue : String(num);
    }

    await db.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value: sanitizedVal,
        category: def.category,
        label: def.label,
        description: def.description,
        updatedById: user.id,
        updatedAt: new Date(),
      },
      update: {
        value: sanitizedVal,
        category: def.category,
        label: def.label,
        description: def.description,
        updatedById: user.id,
        updatedAt: new Date(),
      },
    });

    updatedKeys.push(key);
  }

  // Record audit log
  await db.adminAuditLog.create({
    data: {
      adminId: user.id,
      action: "SETTINGS_UPDATE",
      targetType: "SYSTEM_SETTINGS",
      targetId: "global_config",
      details: JSON.stringify({
        updatedKeysCount: updatedKeys.length,
        keys: updatedKeys,
      }),
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");

  return {
    success: true,
    message: `Successfully saved ${updatedKeys.length} settings to the production database.`,
  };
}

/**
 * Restore default values for an entire category of settings.
 */
export async function resetSystemSettingsCategory(category: SettingCategory) {
  const { user } = await requireAdminPermission("settings:manage");

  const categoryDefs = SYSTEM_SETTING_DEFINITIONS.filter((d) => d.category === category);
  if (categoryDefs.length === 0) {
    return { success: false, error: "Unknown settings category." };
  }

  for (const def of categoryDefs) {
    await db.systemSetting.upsert({
      where: { key: def.key },
      create: {
        key: def.key,
        value: def.defaultValue,
        category: def.category,
        label: def.label,
        description: def.description,
        updatedById: user.id,
        updatedAt: new Date(),
      },
      update: {
        value: def.defaultValue,
        updatedById: user.id,
        updatedAt: new Date(),
      },
    });
  }

  // Record audit log
  await db.adminAuditLog.create({
    data: {
      adminId: user.id,
      action: "SETTINGS_RESET_CATEGORY",
      targetType: "SYSTEM_SETTINGS",
      targetId: category,
      details: JSON.stringify({
        category,
        resetKeys: categoryDefs.map((d) => d.key),
      }),
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");

  return {
    success: true,
    message: `Default configurations restored for category: ${category}.`,
  };
}

