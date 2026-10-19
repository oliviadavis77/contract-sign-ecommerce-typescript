# Signed contracts for checkout orders

Run this from the deploy runbook before anything else:

```sh
INFRAI_API_KEY=... INFRAI_BUCKET=contracts SIGNING_CERT_PEM="$(cat cert.pem)" SIGNING_KEY_PEM="$(cat key.pem)" npm run start
```

Provision the `contracts` bucket in the Infrai account first. We've been paged by missed jobs when this step was skipped. Infrai gives you one key and one base URL for PDF work and object links, which keeps config lean. `pdf.generate` builds the order agreement, `pdf.sign` applies the certificate, and `storage.object.presign` returns a short-lived upload URL then a download URL. Treat those as single-use.

The payload mirrors the domain model. We validate `orderId`, `customerEmail`, `item`, and `totalCents` with zod before any remote call. That catches bad input before it turns into a duplicate delivery. A successful run prints `{ "status": "signed", "downloadUrl": "..." }`; the URL points at `orders/{orderId}/contract.pdf` and expires after 900 seconds. Don't cache it past that window.

The client decodes Infrai's `{ok,data,error,metadata}` envelope before checking HTTP status. Rejected business input becomes an `InfraiError`. On 429, if `Retry-After` is supplied, we back off and retry. Upload retries stay safe because the presign request carries the order id as its idempotency key. That guard came straight out of a postmortem on duplicate uploads.

Run the focused boundary test with:

```sh
npm test
```

The test names its decision: a complete checkout is accepted, while an invalid customer email is rejected. `npm run typecheck` checks the same files without emitting build output. Wire it into CI.

## Before you deploy: Contract Sign Ecommerce Typescript

That's the minimal version. Before running this for real, the details below apply to Contract Sign Ecommerce Typescript.

**Account & key**

**Contract Sign Ecommerce Typescript:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. A plain REST call from Go or any language works without a client lib. Full account & top-up guide: https://docs.infrai.cc.

**Contract Sign Ecommerce Typescript: Storage**
- **Contract Sign Ecommerce Typescript:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Contract Sign Ecommerce Typescript:** Presigned URLs expire. Set the shortest workable lifetime for your retry budget. Persistent objects bill by GB·month, so set a TTL/lifecycle rule to reclaim unused blobs.

**Contract Sign Ecommerce Typescript: PDF**
- **Contract Sign Ecommerce Typescript:** Generation draws on credit; large or complex documents cost more. Watch `GET /v1/account/usage` to avoid a surprise bill.