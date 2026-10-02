import { z } from "zod";
import { InfraiClient } from "./infrai_client.js";

export const checkoutSchema = z.object({
  orderId: z.string().min(1),
  customerEmail: z.string().email(),
  item: z.string().min(1),
  totalCents: z.number().int().positive()
});
export type Checkout = z.infer<typeof checkoutSchema>;

type GenerateData = { pdf_base64: string };
type SignData = { pdf_base64: string };
type PresignData = { url: string };

export async function signOrder(client: InfraiClient, input: Checkout, bucket: string, certPem: string, keyPem: string) {
  const checkout = checkoutSchema.parse(input);
  const generated = await client.request<GenerateData>("POST", "/v1/pdf/generate", {
    html: `<h1>Order ${checkout.orderId}</h1><p>${checkout.item}</p><p>Total: ${checkout.totalCents} cents</p><p>${checkout.customerEmail}</p>`,
    page_size: "A4",
    orientation: "portrait",
    store: false
  });
  const signed = await client.request<SignData>("POST", "/v1/pdf/sign", {
    pdf: generated.pdf_base64,
    cert_pem: certPem,
    key_pem: keyPem,
    reason: "E-commerce order agreement",
    retention_days: 30
  });
  const objectKey = `orders/${checkout.orderId}/contract.pdf`;
  const upload = await client.request<PresignData>("POST", `/v1/storage/object/presign/${encodeURIComponent(bucket)}/${encodeURIComponent(objectKey)}`, {
    op: "put",
    expires_seconds: 900,
    content_type: "application/pdf",
    idempotency_key: checkout.orderId
  });
  const putResponse = await fetch(upload.url, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: Buffer.from(signed.pdf_base64, "base64") });
  if (!putResponse.ok) throw new Error(`object upload failed with ${putResponse.status}`);
  const download = await client.request<PresignData>("POST", `/v1/storage/object/presign/${encodeURIComponent(bucket)}/${encodeURIComponent(objectKey)}`, {
    op: "get",
    expires_seconds: 900,
    response_disposition: "attachment; filename=contract.pdf"
  });
  return { orderId: checkout.orderId, status: "signed", downloadUrl: download.url };
}
