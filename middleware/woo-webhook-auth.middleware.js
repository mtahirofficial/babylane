const crypto = require("crypto");
const { UnauthorizedException, ServerException } = require("../exceptions");

function getPayloadBuffer(req) {
    if (Buffer.isBuffer(req.rawBody)) {
        return req.rawBody;
    }

    if (Buffer.isBuffer(req.body)) {
        return req.body;
    }

    if (typeof req.body === "string") {
        return Buffer.from(req.body, "utf8");
    }

    return Buffer.from(JSON.stringify(req.body || {}), "utf8");
}

function wooWebhookAuth(req, res, next) {
    try {
        console.log("[WooWebhook] Incoming request", {
            method: req.method,
            path: req.originalUrl,
            topic: req.get("x-wc-webhook-topic") || null,
            event: req.get("x-wc-webhook-event") || null,
            source: req.get("user-agent") || null
        });

        const secret = process.env.WC_WEBHOOK_SECRET;
        if (!secret) {
            console.error("[WooWebhook] Missing WC_WEBHOOK_SECRET in environment");
            return next(new ServerException("WC_WEBHOOK_SECRET is not configured"));
        }

        const signature = req.get("x-wc-webhook-signature");
        if (!signature) {
            console.warn("[WooWebhook] Request rejected: signature header missing");
            return next(new UnauthorizedException("Missing WooCommerce webhook signature"));
        }

        const payload = getPayloadBuffer(req);
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("base64");

        const signatureBuffer = Buffer.from(signature, "utf8");
        const expectedBuffer = Buffer.from(expectedSignature, "utf8");

        if (
            signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
        ) {
            console.warn("[WooWebhook] Request rejected: invalid signature");
            return next(new UnauthorizedException("Invalid WooCommerce webhook signature"));
        }
        console.log("[WooWebhook] Signature verified");

        return next();
    } catch (error) {
        console.error("[WooWebhook] Authentication error:", error.message);
        return next(new UnauthorizedException("Webhook authentication failed"));
    }
}

module.exports = wooWebhookAuth;
