import assert from "node:assert/strict";
import { checkoutSchema } from "../src/contract_service.js";

const parsed = checkoutSchema.safeParse({ orderId: "o-1", customerEmail: "buyer@example.com", item: "Support", totalCents: 1200 });
assert.equal(parsed.success, true);
assert.equal(checkoutSchema.safeParse({ orderId: "o-1", customerEmail: "bad", item: "Support", totalCents: 1200 }).success, false);
console.log("checkout boundary: valid orders pass, malformed email is rejected");
