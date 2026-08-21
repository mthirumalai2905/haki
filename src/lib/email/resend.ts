export type ResendStatus = {
  configured: boolean;
  sendEnabled: boolean;
  fromConfigured: boolean;
  from: string | null;
  ok: boolean;
  message: string;
  domains: Array<{ name: string; status?: string }>;
};

function apiKey() {
  return process.env.RESEND_API_KEY?.trim() || "";
}

export function resendConfigured() {
  return Boolean(apiKey());
}

export function resendSendEnabled() {
  return process.env.RESEND_SEND_ENABLED === "true";
}

export function resendFrom() {
  return process.env.RESEND_FROM?.trim() || "";
}

export async function checkResend(): Promise<ResendStatus> {
  const from = resendFrom() || null;
  const sendEnabled = resendSendEnabled();
  if (!resendConfigured()) {
    return {
      configured: false,
      sendEnabled: false,
      fromConfigured: Boolean(from),
      from,
      ok: false,
      message: "RESEND_API_KEY is not set.",
      domains: [],
    };
  }

  try {
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey()}` },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as {
      data?: Array<{ name?: string; status?: string }>;
      message?: string;
      name?: string;
    } | null;

    if (!response.ok) {
      return {
        configured: true,
        sendEnabled,
        fromConfigured: Boolean(from),
        from,
        ok: false,
        message: payload?.message || `Resend returned ${response.status}. The key was rejected.`,
        domains: [],
      };
    }

    const domains = (payload?.data ?? [])
      .filter((item) => item.name)
      .map((item) => ({ name: item.name as string, status: item.status }));

    return {
      configured: true,
      sendEnabled,
      fromConfigured: Boolean(from),
      from,
      ok: true,
      message: sendEnabled
        ? from
          ? "Resend is ready for campaign email."
          : "Resend accepted the key. Set RESEND_FROM to a verified sender before live sends."
        : "Resend accepted the key. Campaign email stays simulated until RESEND_SEND_ENABLED=true.",
      domains,
    };
  } catch (error) {
    return {
      configured: true,
      sendEnabled,
      fromConfigured: Boolean(from),
      from,
      ok: false,
      message: error instanceof Error ? error.message : "Could not reach Resend.",
      domains: [],
    };
  }
}

export async function sendResendEmail(input: {
  to: string;
  subject?: string | null;
  body?: string | null;
}) {
  const from = resendFrom();
  if (!from) {
    return { ok: false, id: null as string | null, message: "RESEND_FROM is not set." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject || "Haki",
      text: input.body || "",
    }),
  });
  const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
  if (!response.ok) {
    return { ok: false, id: null, message: payload?.message || `Resend send failed (${response.status})` };
  }
  return { ok: true, id: payload?.id ?? null, message: "Sent" };
}
