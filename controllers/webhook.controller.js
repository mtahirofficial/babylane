const express = require("express");
const crypto = require("crypto");
const models = require("../models");
const { WooWebhookAuthMiddleware } = require("../middleware");
const { persistWebhookDebugPayload } = require("../utils");

const { Customer, Order, OrderItem, Product, Variant } = models;

function toBoolean(value, fallback = false) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return Boolean(value);
}

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
}

function mapProductPayload(data) {
    const variants = Array.isArray(data?.variants) ? data.variants : [];
    const pickFromVariants = (key) => {
        for (const variant of variants) {
            if (!variant) continue;
            const value = variant[key];
            if (value !== undefined && value !== null && value !== "") return value;
        }
        return null;
    };

    return {
        id: toNumber(data.id, null),
        title: data.title || null,
        slug: data.slug || null,
        sku: data.sku || null,
        purchase_price: pickFromVariants("purchase_price"),
        regular_price: pickFromVariants("regular_price"),
        description: data.description || null,
        short_description: data.short_description || null,
        status: data.status || null,
        published: toBoolean(data.published, false),
        visibility: data.visibility || null,
        manage_stock: toBoolean(data.manage_stock, false),
        stock_quantity: toNumber(data.stock_quantity, 0),
        stock_status: data.stock_status || null,
        featured_image: data.featured_image || null,
        gallery_images: Array.isArray(data.gallery_images) ? data.gallery_images : [],
        attributes: Array.isArray(data.attributes) ? data.attributes : []
    };
}

function mapVariantPayload(item) {
    return {
        id: toNumber(item.id, null),
        title: item.title || null,
        sku: item.sku || null,
        regular_price: item.regular_price ?? null,
        sale_price: item.sale_price ?? null,
        price: item.price ?? null,
        manage_stock: toBoolean(item.manage_stock, false),
        stock_quantity: toNumber(item.stock_quantity, 0),
        stock_status: item.stock_status || null,
        image: item.image || null,
        attributes: item.attributes && typeof item.attributes === "object" ? item.attributes : {}
    };
}

function normalizeCustomerPayload(data, fallbackId = null) {
    const billing = data?.billing || {};
    const shipping = data?.shipping || {};
    const fullName =
        `${billing.first_name || ""} ${billing.last_name || ""}`.trim() ||
        shipping.first_name ||
        "Guest Customer";

    return {
        name: fullName,
        phone: billing.phone || null,
        email: billing.email || data?.email || null,
        address: billing.address_1 || shipping.address_1 || null,
        city: billing.city || shipping.city || null,
        state: billing.state || shipping.state || null,
        postalCode: billing.postcode || shipping.postcode || null,
        country: billing.country || shipping.country || null,
        fallbackId
    };
}

function mapOrderPayload(data, customerId) {
    return {
        id: toNumber(data.id, null),
        orderNumber: data.number || String(data.id || ""),
        customerId,
        subtotal: toNumber(data.subtotal, 0),
        discount: toNumber(data.discount_total, 0),
        shipping: toNumber(data.shipping_total, 0),
        tax: toNumber(data.total_tax, 0),
        total: toNumber(data.total, 0),
        status: data.status || "pending",
        notes: data.customer_note || data.note || null,
        userId: null
    };
}

function mapOrderItemsPayload(orderId, data) {
    const items = Array.isArray(data?.line_items) ? data.line_items : [];

    return items.map((item) => {
        const quantity = toNumber(item?.quantity, 0);
        const lineTotal = toNumber(item?.total, 0);
        const fallbackPrice = quantity > 0 ? lineTotal / quantity : 0;
        const numericPrice = item?.price !== undefined && item?.price !== null
            ? toNumber(item.price, fallbackPrice)
            : fallbackPrice;

        return {
            orderId,
            productId: toNumber(item?.product_id, null),
            variantId: toNumber(item?.variation_id, null),
            title: item?.name || null,
            sku: item?.sku || null,
            price: numericPrice,
            quantity,
            total: lineTotal
        };
    });
}


class WebhookController {
    _path = "/webhook";
    _router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    async persistWebhookPayload(data, req, extra = {}) {
        const secret = process.env.WC_WEBHOOK_SECRET || "";
        const rawBody = Buffer.isBuffer(req?.rawBody) ? req.rawBody : null;
        const payloadAsString = JSON.stringify(data || {});
        const signatureHeader = req?.get?.("x-wc-webhook-signature") || null;
        const expectedFromRaw = rawBody && secret
            ? crypto.createHmac("sha256", secret).update(rawBody).digest("base64")
            : null;
        const expectedFromParsed = secret
            ? crypto.createHmac("sha256", secret).update(Buffer.from(payloadAsString, "utf8")).digest("base64")
            : null;

        const filePath = await persistWebhookDebugPayload({
            prefix: "webhook",
            req,
            data,
            extra: {
                ...extra,
                signatureDebug: {
                    secretConfigured: Boolean(secret),
                    headerLength: signatureHeader ? signatureHeader.length : 0,
                    expectedFromRawLength: expectedFromRaw ? expectedFromRaw.length : 0,
                    expectedFromParsedLength: expectedFromParsed ? expectedFromParsed.length : 0,
                    matchesRaw: Boolean(signatureHeader && expectedFromRaw && signatureHeader === expectedFromRaw),
                    matchesParsed: Boolean(signatureHeader && expectedFromParsed && signatureHeader === expectedFromParsed),
                    expectedFromRawPreview: expectedFromRaw ? `${expectedFromRaw.slice(0, 10)}...` : null,
                    expectedFromParsedPreview: expectedFromParsed ? `${expectedFromParsed.slice(0, 10)}...` : null
                }
            }
        });
        return filePath;
    }

    async processProductWebhook(data, req, res) {
        const filePath = await this.persistWebhookPayload(data, req, { handler: "product-upsert" });
        console.log("[WooWebhook] Request saved to file", { filePath });

        if (!data || !data.id) {
            return res.status(400).json({ success: false, message: "Invalid payload: product id is required" });
        }

        const t = await models.sequelize.transaction();
        try {
            const productPayload = mapProductPayload(data);
            console.log("productPayload", productPayload);

            await Product.upsert(productPayload, { transaction: t });

            const variants = Array.isArray(data.variants) ? data.variants : [];
            for (const variant of variants) {
                if (!variant || !variant.id) continue;
                const variantPayload = mapVariantPayload(variant);
                await Variant.upsert(variantPayload, { transaction: t });
            }

            await t.commit();
        } catch (dbErr) {
            await t.rollback();
            throw dbErr;
        }

        console.log("[WooWebhook] Handler completed successfully");
        return res.status(200).json({ success: true });
    }

    async processProductDeletedWebhook(data, req, res) {
        const filePath = await this.persistWebhookPayload(data, req, { handler: "product-deleted" });
        console.log("[WooWebhook] Request saved to file", { filePath });

        const productId = toNumber(data?.id, null);
        if (!productId) {
            return res.status(400).json({ success: false, message: "Invalid payload: product id is required" });
        }

        const t = await models.sequelize.transaction();
        try {
            const status = data?.status || "trash";
            const [affectedRows] = await Product.update(
                { status, published: false },
                { where: { id: productId }, transaction: t }
            );

            if (!affectedRows) {
                const productPayload = {
                    ...mapProductPayload(data || {}),
                    id: productId,
                    status,
                    published: false
                };
                await Product.create(productPayload, { transaction: t });
            }

            await t.commit();
        } catch (dbErr) {
            await t.rollback();
            throw dbErr;
        }

        console.log("[WooWebhook] Delete handler completed successfully", { productId, action: "marked-as-trash" });
        return res.status(200).json({ success: true });
    }

    async findOrCreateCustomerForOrder(data, transaction) {
        const normalized = normalizeCustomerPayload(data, data?.id);
        let customer = null;

        if (normalized.email) {
            customer = await Customer.findOne({ where: { email: normalized.email }, transaction });
        }

        if (!customer && normalized.phone) {
            customer = await Customer.findOne({ where: { phone: normalized.phone }, transaction });
        }

        if (!customer) {
            customer = await Customer.create(
                {
                    name: normalized.name || `Guest #${normalized.fallbackId || Date.now()}`,
                    phone: normalized.phone,
                    email: normalized.email,
                    address: normalized.address,
                    city: normalized.city,
                    state: normalized.state,
                    postalCode: normalized.postalCode,
                    country: normalized.country
                },
                { transaction }
            );
            return customer;
        }

        await customer.update(
            {
                name: normalized.name || customer.name,
                phone: normalized.phone || customer.phone,
                email: normalized.email || customer.email,
                address: normalized.address || customer.address,
                city: normalized.city || customer.city,
                state: normalized.state || customer.state,
                postalCode: normalized.postalCode || customer.postalCode,
                country: normalized.country || customer.country
            },
            { transaction }
        );

        return customer;
    }

    async processOrderWebhook(data, req, res) {
        const filePath = await this.persistWebhookPayload(data, req, { handler: "order-upsert" });
        console.log("[WooWebhook] Request saved to file", { filePath });

        if (!data || !data.id) {
            return res.status(400).json({ success: false, message: "Invalid payload: order id is required" });
        }

        const t = await models.sequelize.transaction();
        try {
            const customer = await this.findOrCreateCustomerForOrder(data, t);
            const orderPayload = mapOrderPayload(data, customer.id);

            const existingOrder = await Order.findByPk(orderPayload.id, { transaction: t });
            let order;
            if (existingOrder) {
                await existingOrder.update(orderPayload, { transaction: t });
                order = existingOrder;
            } else {
                order = await Order.create(orderPayload, { transaction: t });
            }

            const orderItems = mapOrderItemsPayload(order.id, data);
            await OrderItem.destroy({ where: { orderId: order.id }, transaction: t });
            if (orderItems.length > 0) {
                await OrderItem.bulkCreate(orderItems, { transaction: t });
            }

            await t.commit();
        } catch (dbErr) {
            await t.rollback();
            throw dbErr;
        }

        console.log("[WooWebhook] Order handler completed successfully");
        return res.status(200).json({ success: true });
    }

    async processOrderDeletedWebhook(data, req, res) {
        const filePath = await this.persistWebhookPayload(data, req, { handler: "order-deleted" });
        console.log("[WooWebhook] Request saved to file", { filePath });

        const orderId = toNumber(data?.id, null);
        if (!orderId) {
            return res.status(400).json({ success: false, message: "Invalid payload: order id is required" });
        }

        const t = await models.sequelize.transaction();
        try {
            const status = data?.status || "trash";
            const [affectedRows] = await Order.update(
                { status },
                { where: { id: orderId }, transaction: t }
            );

            if (!affectedRows) {
                const customer = await this.findOrCreateCustomerForOrder(data || {}, t);
                const orderPayload = {
                    ...mapOrderPayload(data || {}, customer.id),
                    id: orderId,
                    status
                };
                await Order.create(orderPayload, { transaction: t });
            }

            await t.commit();
        } catch (dbErr) {
            await t.rollback();
            throw dbErr;
        }

        console.log("[WooWebhook] Order delete handler completed successfully", { orderId, action: "marked-as-trash" });
        return res.status(200).json({ success: true });
    }

    async handleProductCreatedWebhook(req, res, next) {
        try {
            await this.processProductWebhook(req.body, req, res);
        } catch (error) {
            console.error("Webhook error:", error);
            res.status(500).json({ success: false });
        }
    }

    async handleProductUpdatedWebhook(req, res, next) {
        try {
            await this.processProductWebhook(req.body, req, res);
        } catch (error) {
            console.error("Webhook error:", error);
            res.status(500).json({ success: false });
        }
    }

    async handleProductDeletedWebhook(req, res, next) {
        try {
            await this.processProductDeletedWebhook(req.body, req, res);
        } catch (error) {
            console.error("Webhook error:", error);
            res.status(500).json({ success: false });
        }
    }

    async handleProductRestoredWebhook(req, res, next) {
        try {
            await this.processProductWebhook(req.body, req, res);
        } catch (error) {
            console.error("Webhook error:", error);
            res.status(500).json({ success: false });
        }
    }

    async handleOrderCreatedWebhook(req, res, next) {
        try {
            await this.processOrderWebhook(req.body, req, res);
        } catch (error) {
            console.error("Webhook error:", error);
            res.status(500).json({ success: false });
        }
    }

    async handleOrderUpdatedWebhook(req, res, next) {
        try {
            await this.processOrderWebhook(req.body, req, res);
        } catch (error) {
            console.error("Webhook error:", error);
            res.status(500).json({ success: false });
        }
    }

    async handleOrderDeletedWebhook(req, res, next) {
        try {
            await this.processOrderDeletedWebhook(req.body, req, res);
        } catch (error) {
            console.error("Webhook error:", error);
            res.status(500).json({ success: false });
        }
    }

    async handleOrderRestoredWebhook(req, res, next) {
        try {
            await this.processOrderWebhook(req.body, req, res);
        } catch (error) {
            console.error("Webhook error:", error);
            res.status(500).json({ success: false });
        }
    }

    initializeRoutes() {
        this._router.post(
            `${this._path}/product/created`,
            WooWebhookAuthMiddleware,
            this.handleProductCreatedWebhook.bind(this)
        );

        this._router.post(
            `${this._path}/product/updated`,
            WooWebhookAuthMiddleware,
            this.handleProductUpdatedWebhook.bind(this)
        );

        this._router.post(
            `${this._path}/product/deleted`,
            WooWebhookAuthMiddleware,
            this.handleProductDeletedWebhook.bind(this)
        );

        this._router.post(
            `${this._path}/product/restored`,
            WooWebhookAuthMiddleware,
            this.handleProductRestoredWebhook.bind(this)
        );

        this._router.post(
            `${this._path}/order/created`,
            WooWebhookAuthMiddleware,
            this.handleOrderCreatedWebhook.bind(this)
        );

        this._router.post(
            `${this._path}/order/updated`,
            WooWebhookAuthMiddleware,
            this.handleOrderUpdatedWebhook.bind(this)
        );

        this._router.post(
            `${this._path}/order/deleted`,
            WooWebhookAuthMiddleware,
            this.handleOrderDeletedWebhook.bind(this)
        );

        this._router.post(
            `${this._path}/order/restored`,
            WooWebhookAuthMiddleware,
            this.handleOrderRestoredWebhook.bind(this)
        );
    }
}

module.exports = WebhookController;
