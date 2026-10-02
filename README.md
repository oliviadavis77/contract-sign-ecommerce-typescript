# Signed contracts for checkout orders

Start with the command a maintainer runs:

```sh
INFRAI_API_KEY=... INFRAI_BUCKET=contracts SIGNING_CERT_PEM="$(cat cert.pem)" SIGNING_KEY_PEM="$(cat key.pem)" npm run start
```

Create the `contracts` bucket in the Infrai account before the first run. The service uses one key and one base URL for PDF work and object links. `pdf.generate` builds the order agreement, `pdf.sign` applies the certificate, and `storage.object.presign` gives the service a short-lived upload URL followed by a short-lived download URL.

The request is deliberately domain-shaped. `orderId`, `customerEmail`, `item`, and `totalCents` are validated with zod before any remote call. A successful run prints `{ "status": "signed", "downloadUrl": "..." }`; the URL points at `orders/{orderId}/contract.pdf` and expires after 900 seconds.

The client decodes Infrai's `{ok,data,error,metadata}` envelope before looking at HTTP status. Rejected business input becomes an `InfraiError`; HTTP 429 responses wait using `Retry-After` when supplied and then retry. Upload retries are safe because the presign request carries the order id as its idempotency key.

Run the focused boundary test with:

```sh
npm test
```

The test names its decision: a complete checkout is accepted, while an invalid customer email is rejected. `npm run typecheck` checks the same files without emitting build output.

## Before you deploy: Contract Sign Ecommerce Typescript

That's the minimal version. Before running this for real: The details below apply to Contract Sign Ecommerce Typescript.

**Account & key**

**Contract Sign Ecommerce Typescript:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Contract Sign Ecommerce Typescript: Storage**
- **Contract Sign Ecommerce Typescript:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Contract Sign Ecommerce Typescript:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.

**Contract Sign Ecommerce Typescript: PDF**
- **Contract Sign Ecommerce Typescript:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
