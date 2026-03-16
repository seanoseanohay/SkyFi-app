import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const payload = await req.json();
    const subscriptionId =
      payload.subscriptionId ?? payload.subscription_id ?? null;
    const purchaseInvitation = payload.skyfi_purchase_invitation ?? null;

    const event = await prisma.aoiEvent.create({
      data: {
        userId,
        subscriptionId,
        payload,
        purchaseInvitation,
        emailSent: false,
      },
    });

    // Send email notification if Resend is configured
    if (resend && process.env.RESEND_FROM_EMAIL) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        const sub = subscriptionId
          ? await prisma.aoiSubscription.findFirst({
              where: { subscriptionId },
              select: { label: true },
            })
          : null;

        const areaLabel = sub?.label ?? subscriptionId ?? "your monitored area";
        const inviteText =
          purchaseInvitation?.guidance_message ??
          "New satellite imagery is available for your monitored area.";

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: user.email,
          subject: `🛰️ New collect available — ${areaLabel}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#0f1117">SkyFi Agent — New Collect Alert</h2>
              <p>Hi ${user.name ?? "there"},</p>
              <p>${inviteText}</p>
              ${
                purchaseInvitation?.thumbnail_url
                  ? `<img src="${purchaseInvitation.thumbnail_url}" style="width:100%;border-radius:8px;margin:16px 0" alt="Thumbnail" />`
                  : ""
              }
              <p>
                <a href="${process.env.NEXTAUTH_URL}/notifications" style="background:#3b82f6;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
                  View in SkyFi Agent
                </a>
              </p>
              <p style="color:#888;font-size:12px">Monitoring area: ${areaLabel}</p>
            </div>
          `,
        });

        await prisma.aoiEvent.update({
          where: { id: event.id },
          data: { emailSent: true },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
