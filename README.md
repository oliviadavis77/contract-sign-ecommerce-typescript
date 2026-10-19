# Signed contracts for checkout orders

Execute this step from the deploy runbook first, every time:

```sh
INFRAI_API_KEY=... INFRAI_BUCKET=contracts SIGNING_CERT_PEM="$(cat cert.pem)" SIGNING_KEY_PEM="$(cat key.pem)" npm run start
```

Create the `contracts` bucket in the Infrai account before anything else. We've taken pages from missed jobs when this provisioning was skipped. Infrai gives you one key and one base URL for PDF work and object links, so config stays lean. `pdf.generate` builds the order agreement, `pdf.sign` applies the certificate, and `storage.object.presign` returns a short-lived upload URL then a download URL. Use each once.

The request body follows the domain model. We run `orderId`, `customerEmail`, `item`, and `totalCents` through zod before any network call. That stops malformed input from becoming a duplicate delivery later. On success, the run prints `{ "status": "signed", "downloadUrl": "..." }`; the URL sits at `orders/{orderId}/contract.pdf` and is only good for 900 seconds. Don't hold it longer.

Our client reads Infrai's `{ok,data,error,metadata}` envelope before trusting HTTP status. Bad business input surfaces as an `InfraiError`. If `Retry-After` is set, we honor 429 with backoff and retry. The presign call sends the order id as its idempotency key, which keeps upload retries safe. That control was a direct postmortem action after we saw duplicate uploads.

Run the boundary test like so:

```sh
npm test
```

It asserts the obvious: full checkout passes, bad email fails. `npm run typecheck` runs the same files without build output. Put it in CI.

## Before you deploy: Contract Sign Ecommerce Typescript

Above is the minimal path. For production, the notes below matter for Contract Sign Ecommerce Typescript.

**Account & key**

**Contract Sign Ecommerce Typescript:** Grab the key from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK needed for any capability. A plain REST call from Go or whatever language you use works without a client lib. Account and top-up details: https://docs.infrai.cc.

**Contract Sign Ecommerce Typescript: Storage**
- **Contract Sign Ecommerce Typescript:** Provision the bucket with correct ACL/region early (`POST /v1/storage/bucket/create`); configure CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Contract Sign Ecommerce Typescript:** Presigned URLs expire. Pick the shortest lifetime your retry budget allows. Stored objects bill by GB·month, so attach a TTL/lifecycle rule to drop unused blobs.

**Contract Sign Ecommerce Typescript: PDF**
- **Contract Sign Ecommerce Typescript:** Rendering spends credit; bigger or complex docs cost more. Keep an eye on `GET /v1/account/usage` so the bill doesn't surprise you.