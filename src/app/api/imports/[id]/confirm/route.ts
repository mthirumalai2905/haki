import { db } from "@/lib/db";
import { getWorkspace } from "@/lib/workspace";
import { parseImportFile } from "@/lib/import/parse";
import { normalizeRow, companyDomain } from "@/lib/import/normalize";
import { recordActivity } from "@/lib/activity";
import { audit } from "@/lib/audit";
import { parseJson } from "@/lib/utils";
import { AppError } from "@/lib/errors";
import { jsonError, jsonOk } from "../../../_utils";
import type { FieldMapping } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspace = await getWorkspace();
    const { id } = await params;
    const item = await db.import.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!item) throw new AppError("NOT_FOUND", "Import not found.", 404);

    await db.import.update({
      where: { id },
      data: { status: "importing" },
    });

    const mappings = parseJson<FieldMapping[]>(item.mappings, []);
    const parsed = await parseImportFile(item.filePath, item.fileType);

    let imported = 0;
    let validEmails = 0;
    let validPhones = 0;

    for (const row of parsed.rows) {
      const lead = normalizeRow(row, mappings, item.fileName);
      let companyId: string | undefined;

      if (lead.companyName) {
        const company = await db.company.upsert({
          where: {
            workspaceId_name: { workspaceId: workspace.id, name: lead.companyName },
          },
          create: {
            workspaceId: workspace.id,
            name: lead.companyName,
            website: lead.website,
            domain: companyDomain(lead),
            industry: lead.industry,
            companySize: lead.companySize,
            country: lead.country,
          },
          update: {
            website: lead.website ?? undefined,
            industry: lead.industry ?? undefined,
            companySize: lead.companySize ?? undefined,
            country: lead.country ?? undefined,
          },
        });
        companyId = company.id;
      }

      const created = await db.lead.create({
        data: {
          workspaceId: workspace.id,
          companyId,
          importId: item.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          fullName: lead.fullName,
          jobTitle: lead.jobTitle,
          email: lead.email,
          phone: lead.phone,
          linkedin: lead.linkedin,
          whatsapp: lead.whatsapp,
          reddit: lead.reddit,
          x: lead.x,
          instagram: lead.instagram,
          youtube: lead.youtube,
          tiktok: lead.tiktok,
          googleWorkspace: lead.googleWorkspace,
          website: lead.website,
          country: lead.country,
          industry: lead.industry,
          companySize: lead.companySize,
          source: lead.source,
          customFields: JSON.stringify(lead.customFields),
          emailValid: lead.emailValid,
          phoneValid: lead.phoneValid,
        },
      });

      imported += 1;
      if (lead.emailValid) validEmails += 1;
      if (lead.phoneValid) validPhones += 1;

      await recordActivity({
        workspaceId: workspace.id,
        leadId: created.id,
        action: "lead_imported",
        metadata: { importId: item.id },
      });
    }

    const updated = await db.import.update({
      where: { id },
      data: {
        status: "completed",
        completedAt: new Date(),
        stats: JSON.stringify({
          ...parsed.stats,
          imported,
          validEmails,
          validPhones,
        }),
      },
    });

    await audit({
      workspaceId: workspace.id,
      action: "lead_imported",
      objectType: "import",
      objectId: item.id,
      metadata: { imported },
    });

    return jsonOk({
      importId: updated.id,
      imported,
      validEmails,
      validPhones,
    });
  } catch (error) {
    const { id } = await params;
    await db.import.update({
      where: { id },
      data: { status: "failed", error: "Import could not be completed." },
    }).catch(() => undefined);
    return jsonError(error);
  }
}
