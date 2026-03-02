import { createAuditLog } from "@/features/audit/services/audit-service";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

type LogLevel = "info" | "success" | "warning" | "error";

interface LogOptions {
  title: string;
  description?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  level?: LogLevel;
  actor?: string;
}

const LEVEL_COLORS: Record<LogLevel, number> = {
  info: 0x3b82f6,    // blue
  success: 0x22c55e, // green
  warning: 0xf59e0b, // amber
  error: 0xef4444,   // red
};

const LEVEL_EMOJI: Record<LogLevel, string> = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

export async function logToDiscord(options: LogOptions): Promise<void> {
  if (!DISCORD_WEBHOOK_URL) return;

  const { title, description, fields, level = "info", actor } = options;

  const embed: Record<string, unknown> = {
    title: `${LEVEL_EMOJI[level]} ${title}`,
    color: LEVEL_COLORS[level],
    timestamp: new Date().toISOString(),
  };

  if (description) embed.description = description;

  const allFields = [...(fields ?? [])];
  if (actor) {
    allFields.push({ name: "Actor", value: actor, inline: true });
  }
  allFields.push({
    name: "Environment",
    value: process.env.NODE_ENV ?? "development",
    inline: true,
  });

  if (allFields.length > 0) {
    embed.fields = allFields.map((f) => ({
      name: f.name,
      value: f.value,
      inline: f.inline ?? false,
    }));
  }

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch {
    // Silently fail — webhook errors must never break the application
    console.error("[discord] Failed to send webhook");
  }
}

// ── Convenience helpers ──

export function logAdminAction(
  action: "created" | "updated" | "deleted",
  resource: string,
  identifier: string,
  actor: string,
  extra?: { name: string; value: string; inline?: boolean }[],
  opts?: { resource_id?: string; actor_id?: string; ip_address?: string },
) {
  const level: LogLevel =
    action === "deleted" ? "warning" : action === "updated" ? "info" : "success";

  // Persist to database (fire-and-forget)
  const details: Record<string, unknown> = { identifier };
  if (extra) {
    for (const field of extra) {
      details[field.name] = field.value;
    }
  }

  createAuditLog({
    action,
    resource,
    resource_id: opts?.resource_id ?? null,
    actor_id: opts?.actor_id ?? null,
    actor_email: actor,
    details,
    ip_address: opts?.ip_address ?? null,
  }).catch(() => {
    // Silently fail — audit persistence must never break the app
  });

  return logToDiscord({
    title: `${resource} ${action}`,
    description: `**${identifier}**`,
    fields: extra,
    level,
    actor,
  });
}

/**
 * Compare incoming update data against existing record.
 * Returns only the fields that actually changed, with old → new values.
 * Skips sensitive fields (password) and complex fields (images).
 */
export function diffFields(
  incoming: Record<string, unknown>,
  existing: Record<string, unknown>,
  skipKeys: string[] = [],
): { name: string; value: string; inline?: boolean }[] {
  const fields: { name: string; value: string; inline?: boolean }[] = [];

  for (const [key, newVal] of Object.entries(incoming)) {
    if (skipKeys.includes(key)) continue;
    if (newVal === undefined) continue;

    const oldVal = existing[key];

    // Stringify for comparison (handles booleans, numbers, etc.)
    const oldStr = String(oldVal ?? "—");
    const newStr = String(newVal ?? "—");

    if (oldStr !== newStr) {
      fields.push({ name: key, value: `${oldStr} → ${newStr}`, inline: true });
    }
  }

  return fields;
}

export function logAdminError(
  operation: string,
  errorMessage: string,
  actor?: string,
) {
  return logToDiscord({
    title: `Failed: ${operation}`,
    description: `\`\`\`${errorMessage}\`\`\``,
    level: "error",
    actor: actor ?? "unknown",
  });
}
