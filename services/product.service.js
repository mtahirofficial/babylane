'use strict';
const models = require('../models');
const { Product } = models;

async function create(body, file, req) {
    const t = await models.sequelize.transaction();
    try {
        const product = await createOrUpdateProduct(null, body, file, req, t);
        await t.commit();
        return product;
    } catch (e) {
        await t.rollback();
        throw e;
    }
}

async function update(productId, body, file, req) {
    const t = await models.sequelize.transaction();
    try {
        const product = await createOrUpdateProduct(productId, body, file, req, t);
        await t.commit();
        return product;
    } catch (e) {
        await t.rollback();
        throw e;
    }
}

async function createOrUpdateProduct(productId, body, file, req, t) {
    const data = parseProduct(body, file, req);
    let product;
    if (productId) {
        product = await Product.findByPk(productId, { transaction: t });
        if (!product) throw new Error("Product not found");
        await product.update(data, { transaction: t });
    } else {
        product = await Product.create(data, { transaction: t, raw: true });
    }
    return product;
}

function parseBoolean(value, fallback = false) {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";
    return Boolean(value);
}

function parseJsonArray(value, fallback = []) {
    if (value === undefined || value === null || value === "") return fallback;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch (e) {
            return fallback;
        }
    }
    return fallback;
}

function parseProduct(body, file, req) {
    let featured_image = body.featured_image || "";
    const parsedId = Number(body.id);

    if (file && req) {
        featured_image = `${req.protocol}://${req.get("host")}/files/${file.filename}`;
    }

    const payload = {
        title: body.title || null,
        slug: body.slug || null,
        sku: body.sku || null,
        description: body.description || null,
        short_description: body.short_description || null,
        status: body.status || "active",
        published: parseBoolean(body.published, false),
        visibility: body.visibility || null,
        manage_stock: parseBoolean(body.manage_stock, false),
        stock_quantity: Number(body.stock_quantity || 0),
        stock_status: body.stock_status || null,
        featured_image,
        gallery_images: parseJsonArray(body.gallery_images, []),
        attributes: parseJsonArray(body.attributes, [])
    };

    if (!Number.isNaN(parsedId) && parsedId > 0) {
        payload.id = parsedId;
    }

    return payload;
}

module.exports = {
    create,
    update
};
