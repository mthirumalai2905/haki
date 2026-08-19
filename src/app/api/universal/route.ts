import { AppError } from "@/lib/errors";
import { collectOpenData } from "@/lib/universal/sources/collect";
import { draftUniversal, rowLabel } from "@/lib/universal/run";
import type { UniversalStreamEvent } from "@/lib/universal/types";
import { jsonError } from "../_utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body.message ?? "").trim();
    if (!message) {
      throw new AppError("EMPTY_MESSAGE", "Describe who you want and which columns.");
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: UniversalStreamEvent) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        try {
          const draft = draftUniversal(message);
          send({
            type: "plan",
            plan: draft.plan,
            filename: draft.filename,
            target: draft.target,
          });

          if (draft.plan.refused) {
            send({ type: "error", message: draft.plan.refuseReason || "That brief is not allowed." });
            send({ type: "done", found: 0, filename: draft.filename });
            controller.close();
            return;
          }

          for (const [index, text] of draft.plan.thoughts.entries()) {
            await wait(140);
            send({ type: "thought", index, text });
          }

          send({ type: "status", text: "DeepSeek routed the brief. Querying open-data APIs…" });
          const collected = await collectOpenData({
            brief: message,
            plan: draft.plan,
            target: draft.target,
          });

          send({
            type: "plan",
            plan: {
              ...draft.plan,
              sources: [collected.source],
              notes: `${collected.reason} ${collected.rows.length} public records returned. Empty fields were not published by the source.`,
            },
            filename: draft.filename,
            target: draft.target,
          });
          send({ type: "status", text: `Reading ${collected.source}…` });

          if (!collected.rows.length) {
            send({
              type: "error",
              message: `${collected.source} returned no public records for that brief. Try a broader audience or a city amenity list.`,
            });
            send({ type: "done", found: 0, filename: draft.filename });
            controller.close();
            return;
          }

          for (const [index, row] of collected.rows.entries()) {
            await wait(40 + (index % 4) * 12);
            send({
              type: "hit",
              found: index + 1,
              target: draft.target,
              row,
              label: rowLabel(row),
              source: collected.source,
            });
          }

          send({ type: "done", found: collected.rows.length, filename: draft.filename });
        } catch (error) {
          send({
            type: "error",
            message: error instanceof Error ? error.message : "Haki Universal could not finish that brief.",
          });
          send({ type: "done", found: 0, filename: "haki-universal.csv" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
