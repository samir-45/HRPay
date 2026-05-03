import { db } from "@workspace/db";
import { announcementsTable } from "@workspace/db";

type NotifyType = "info" | "success" | "warning" | "urgent" | "celebration";

export async function notify(
  title: string,
  content: string,
  type: NotifyType = "info",
  publishedBy = "System",
  companyId?: number | null
) {
  try {
    await db.insert(announcementsTable).values({
      title,
      content,
      type,
      publishedBy,
      ...(companyId ? { companyId } : {}),
    });
  } catch {
    // Never let notification failures break the main workflow
  }
}
