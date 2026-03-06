const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

function safeHeader(req, name) {
    return req?.get?.(name) || null;
}

async function persistWebhookDebugPayload({ prefix = "webhook", req = null, data = null, extra = {} } = {}) {
    const webhookDir = path.join(process.cwd(), "webhooks");
    await fs.mkdir(webhookDir, { recursive: true });

    const fileName = `${prefix}-${Date.now()}.json`;
    const filePath = path.join(webhookDir, fileName);

    const rawBody = Buffer.isBuffer(req?.rawBody) ? req.rawBody : null;
    const rawBodyBuffer = rawBody
        || (typeof req?.body === "string" ? Buffer.from(req.body, "utf8") : null)
        || (Buffer.isBuffer(req?.body) ? req.body : null)
        || Buffer.from(JSON.stringify(req?.body || {}), "utf8");
    const rawBodyString = rawBodyBuffer.toString("utf8");
    const parsedBodyString = JSON.stringify(data || {});

    const payload = {
        savedAt: new Date().toISOString(),
        request: req ? {
            method: req.method,
            url: req.originalUrl,
            headers: {
                "content-type": safeHeader(req, "content-type"),
                "content-length": safeHeader(req, "content-length"),
                "x-wc-webhook-id": safeHeader(req, "x-wc-webhook-id"),
                "x-wc-webhook-topic": safeHeader(req, "x-wc-webhook-topic"),
                "x-wc-webhook-event": safeHeader(req, "x-wc-webhook-event"),
                "x-wc-webhook-resource": safeHeader(req, "x-wc-webhook-resource"),
                "x-wc-webhook-signature": safeHeader(req, "x-wc-webhook-signature")
            },
            rawBody: {
                exists: Boolean(rawBody),
                byteLength: rawBodyBuffer.length,
                sha256: crypto.createHash("sha256").update(rawBodyBuffer).digest("hex"),
                preview: rawBodyString.slice(0, 500)
            },
            parsedBody: {
                type: Array.isArray(data) ? "array" : typeof data,
                byteLength: Buffer.byteLength(parsedBodyString, "utf8"),
                sha256: crypto.createHash("sha256").update(parsedBodyString).digest("hex")
            }
        } : null,
        ...extra,
        data
    };

    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
    return filePath;
}

module.exports = {
    persistWebhookDebugPayload
};
