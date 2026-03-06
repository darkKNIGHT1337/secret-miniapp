import { NextResponse } from "next/server";
import { CATALOG } from "@/lib/catalog";

const API = "https://pay.crypt.bot/api";

export async function POST(req: Request) {
  try {
    const token = process.env.CRYPTOBOT_TOKEN;

    if (!token) {
      return NextResponse.json(
        { error: "Missing CRYPTOBOT_TOKEN" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const itemId = Number(body?.itemId);

    if (!itemId) {
      return NextResponse.json(
        { error: "Missing itemId" },
        { status: 400 }
      );
    }

    const item = CATALOG.find((x) => x.id === itemId);

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    // У услуг нет фиксированной оплаты
    if (item.section === "services") {
      return NextResponse.json(
        { error: "Services are negotiable and cannot be paid automatically." },
        { status: 400 }
      );
    }

    const amount = String(item.priceUSD);
    const description = `Оплата: ${item.title}`;
    const payload = `item_${itemId}_${Date.now()}`;

    const r = await fetch(`${API}/createInvoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Crypto-Pay-API-Token": token,
      },
      body: JSON.stringify({
        asset: "USDT",
        amount,
        description,
        payload,
        allow_anonymous: false,
        expires_in: 3600,
      }),
    });

    const data = await r.json();

    if (!data?.ok) {
      return NextResponse.json(
        { error: "CryptoBot API error", details: data },
        { status: 502 }
      );
    }

    const invoice = data.result;

    const bestUrl =
      invoice?.web_app_pay_url ||
      invoice?.pay_url ||
      invoice?.mini_app_invoice_url ||
      invoice?.bot_invoice_url;

    if (!bestUrl) {
      return NextResponse.json(
        { error: "No pay url in invoice", invoice },
        { status: 502 }
      );
    }

    return NextResponse.json({
      invoice_id: invoice.invoice_id,
      pay_url: bestUrl,
      status: invoice.status,
      kind: invoice?.web_app_pay_url
        ? "web_app_pay_url"
        : invoice?.pay_url
        ? "pay_url"
        : invoice?.mini_app_invoice_url
        ? "mini_app_invoice_url"
        : invoice?.bot_invoice_url
        ? "bot_invoice_url"
        : "other",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}