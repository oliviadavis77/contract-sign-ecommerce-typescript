import { InfraiClient } from "./infrai_client.js";
import { signOrder } from "./contract_service.js";

const key = process.env.INFRAI_API_KEY;
const bucket = process.env.INFRAI_BUCKET;
const certPem = process.env.SIGNING_CERT_PEM;
const keyPem = process.env.SIGNING_KEY_PEM;
if (!key || !bucket || !certPem || !keyPem) throw new Error("Set INFRAI_API_KEY, INFRAI_BUCKET, SIGNING_CERT_PEM, and SIGNING_KEY_PEM");

const result = await signOrder(new InfraiClient(key), {
  orderId: process.env.ORDER_ID ?? "demo-1001",
  customerEmail: process.env.CUSTOMER_EMAIL ?? "buyer@example.com",
  item: process.env.ORDER_ITEM ?? "Annual support",
  totalCents: Number(process.env.ORDER_TOTAL_CENTS ?? 9900)
}, bucket, certPem, keyPem);
console.log(JSON.stringify(result, null, 2));
