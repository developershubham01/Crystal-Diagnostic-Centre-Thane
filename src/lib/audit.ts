import { PrismaClient } from "@prisma/client";
import type { SessionPayload } from "./auth";

/** Writes an audit trail entry for admin actions. Never throws. */
export async function logAudit(
  client: PrismaClient,
  session: SessionPayload | null,
  action: string,
  entity?: string | null,
  entityId?: string | null,
  details?: string | null
) {
  try {
    await client.auditLog.create({
      data: {
        adminId: session?.adminId ?? null,
        adminName: session?.username ?? "system",
        action,
        entity: entity ?? null,
        entityId: entityId ?? null,
        details: details ?? null,
      },
    });
  } catch (e) {
    console.error("audit log failed", e);
  }
}
