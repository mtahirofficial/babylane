'use strict';
const models = require('../models');
const { Variant } = models;

async function bulkCreate(variants) {

    if (!Array.isArray(variants) || !variants.length) return [];

    const t = await models.sequelize.transaction();
    try {
        const created = [];
        for (const v of variants) {

            created.push(await Variant.create(v, { transaction: t, raw: true }));
        }
        await t.commit();
        return created;
    } catch (e) {
        await t.rollback();
        throw e;
    }
}

async function update(id, payload) {
    const variant = await Variant.findByPk(id);
    // console.log("payload", payload);
    // console.log("variant", variant);

    if (!variant) throw new Error("Variant not found");
    return variant.update(payload);
}

/* =========================
   DELETE REMOVED VARIANTS
========================= */
async function syncDeleted(productId, keepIds = []) {
    await Variant.destroy({
        where: {
            productId,
            id: { [models.Sequelize.Op.notIn]: keepIds }
        }
    });
}

module.exports = {
    bulkCreate,
    update,
    syncDeleted
};
