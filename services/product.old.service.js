'use strict';
const models = require('../models');
const MulterMiddleware = require('../middleware/multer.middleware');
const { Product, Variant, ProductOption, ProductOptionValue, VariantOptionValue } = models;

async function createVariants(variants, productId = null, externalTransaction = null) {
  const useExternal = Boolean(externalTransaction);
  const t = externalTransaction || await models.sequelize.transaction();
  try {
    const createdVariants = [];
    for (const v of variants) {
      const variantData = Object.assign({}, v);
      if (!variantData.productId && productId) variantData.productId = productId;
      delete variantData.optionValues;
      delete variantData.optionValueIds;

      const created = await Variant.create(variantData, { transaction: t });

      if (v.optionValueIds && Array.isArray(v.optionValueIds)) {
        for (const valId of v.optionValueIds) {
          const pov = await ProductOptionValue.findByPk(valId, { transaction: t });
          if (pov) {
            await VariantOptionValue.create({ variantId: created.id, optionId: pov.optionId, optionValueId: pov.id }, { transaction: t });
          }
        }
      }

      if (v.optionValues && Array.isArray(v.optionValues)) {
        for (const ov of v.optionValues) {
          if (ov.optionValueId && ov.optionId) {
            await VariantOptionValue.create({ variantId: created.id, optionId: ov.optionId, optionValueId: ov.optionValueId }, { transaction: t });
          } else if (ov.optionId && ov.value) {
            const pov = await ProductOptionValue.findOne({ where: { optionId: ov.optionId, value: ov.value }, transaction: t });
            if (pov) await VariantOptionValue.create({ variantId: created.id, optionId: ov.optionId, optionValueId: pov.id }, { transaction: t });
          } else if (ov.optionName && ov.value && (variantData.productId || productId)) {
            const pid = variantData.productId || productId;
            const po = await ProductOption.findOne({ where: { productId: pid, name: ov.optionName }, transaction: t });
            if (po) {
              const pov = await ProductOptionValue.findOne({ where: { optionId: po.id, value: ov.value }, transaction: t });
              if (pov) await VariantOptionValue.create({ variantId: created.id, optionId: po.id, optionValueId: pov.id }, { transaction: t });
            }
          }
        }
      }

      createdVariants.push(created);
    }

    if (!useExternal) await t.commit();
    return createdVariants;
  } catch (e) {
    if (!useExternal) await t.rollback();
    throw e;
  }
}

async function createProductWithExtras(body = {}, file = null, req = null) {
  const t = await models.sequelize.transaction();
  console.log("body", body);
  try {
    const title = body.title || '';
    const description = body.description || '';
    const sku = body.sku || '';
    const costPrice = Number(body.costPrice || 0);
    const salePrice = Number(body.salePrice || 0);
    const markupPercentage = Number(body.markupPercentage || 0);
    const dc = Number(body.dc || 0);
    const autoPriceEnabled = body.autoPriceEnabled === undefined ? true : (body.autoPriceEnabled === 'true' || body.autoPriceEnabled === true);
    const status = body.status || 'active';

    let tags = [];
    if (body.tags) {
      try {
        tags = typeof body.tags === 'string' ? JSON.parse(body.tags) : body.tags;
      } catch (e) {
        tags = String(body.tags).split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    let mainImage = body.mainImage || '';
    if (file && req) {
      mainImage = `${req.protocol}://${req.get('host')}${MulterMiddleware.baseFilePath}${file.filename}`;
    }

    const product = await Product.create({
      title,
      description,
      sku,
      costPrice,
      salePrice,
      markupPercentage,
      dc,
      autoPriceEnabled,
      status,
      tags,
      mainImage
    }, { transaction: t });

    // parse options
    let options = [];
    if (body.options) {
      options = typeof body.options === 'string' ? JSON.parse(body.options) : body.options;
    } else {
      for (let i = 1; i <= 3; i++) {
        const nameKey = `option${i}Name`;
        const valuesKey = `option${i}Values`;
        console.log("valuesKey", valuesKey);

        if (body[nameKey]) {
          let vals = body[valuesKey] || [];
          console.log("vals", vals);
          if (typeof vals === 'string') {
            try { vals = JSON.parse(vals); } catch (e) { vals = String(vals).split(',').map(v => v.trim()).filter(Boolean); }
          }
          options.push({ name: body[nameKey], values: vals, position: i });
        }
      }
    }
    console.log("options", options);

    const optionValueIdMap = {};
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const position = opt.position || (i + 1);
      const createdOpt = await ProductOption.create({ productId: product.id, name: opt.name, position }, { transaction: t });
      console.log("createdOpt", createdOpt);
      optionValueIdMap[createdOpt.id] = {};
      if (Array.isArray(opt.values)) {
        for (const v of opt.values) {
          const createdVal = await ProductOptionValue.create({ optionId: createdOpt.id, value: v }, { transaction: t });
          console.log("createdVal", createdVal);
          optionValueIdMap[createdOpt.id][v] = createdVal.id;
        }
      }
      console.log("optionValueIdMap", optionValueIdMap);
    }

    // create variants if provided
    if (body.variants) {
      const variants = typeof body.variants === 'string' ? JSON.parse(body.variants) : body.variants;
      if (Array.isArray(variants) && variants.length > 0) {
        await createVariants(variants, product.id, t);
      }
    }

    await t.commit();
    return product;
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

module.exports = {
  createProductWithExtras,
  createVariants
};
