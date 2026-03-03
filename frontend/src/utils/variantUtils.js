// src/utils/variantUtils.js
import { traits, colors, items } from "./constants.json";

// Generate Cartesian product of option arrays (only non-empty option arrays)
export function generateCombinations(optionsArr) {
    // optionsArr is [[opt1Vals], [opt2Vals], [opt3Vals]] but may include [] or null
    const arrays = optionsArr.filter(arr => Array.isArray(arr) && arr.length > 0);
    if (arrays.length === 0) return [];

    // start with first array
    let result = arrays[0].map(v => [v]);

    for (let i = 1; i < arrays.length; i++) {
        const arr = arrays[i];
        const temp = [];
        result.forEach(prefix => {
            arr.forEach(v => {
                temp.push([...prefix, v]);
            });
        });
        result = temp;
    }

    // normalize to objects with option1/2/3 mapping
    return result.map(vals => {
        return {
            option1: vals[0] || null,
            option2: vals[1] || null,
            option3: vals[2] || null,
            // combination key for stable matching
            combKey: vals.join("___")
        };
    });
}

// Merge existing variants (array) with generated combos:
// If a variant exists for a combKey, keep its editable fields, else create default variant object.
export function mergeVariants(generatedCombos, existingVariants = [], product) {
    const map = new Map();
    existingVariants.forEach(v => {
        // create key from option fields
        const key = [v.option1 || "", v.option2 || "", v.option3 || ""].filter(Boolean).join("___");
        if (key) map.set(key, v);
    });

    return generatedCombos.map((combo, idx) => {
        const key = combo.combKey;
        const existing = map.get(key);
        if (existing) {
            // keep existing editable fields but ensure option fields reflect combo
            return {
                ...existing,
                option1: combo.option1 || null,
                option2: combo.option2 || null,
                option3: combo.option3 || null,
                combKey: key
            };
        } else {
            // default new variant
            return {
                id: null,
                productId: null,
                title: [combo.option1, combo.option2, combo.option3].filter(Boolean).join(" / "),
                active: true,
                sku: generateSKU(product.title, product.salePrice, [combo.option1, combo.option2, combo.option3]),
                barcode: "",
                cost: product.costPrice,
                price: product.salePrice,
                markupPercentage: 0,
                autoPriceEnabled: false,
                stock: "",
                option1: combo.option1 || null,
                option2: combo.option2 || null,
                option3: combo.option3 || null,
                weight: 0,
                weightUnit: "kg",
                requiresShipping: true,
                image: null,
                combKey: key
            };
        }
    });
}

export function generateSKU(title, price, optionValues = []) {
    // 1. Title first letters
    const titlePart = title
        .trim()
        .split(/\s+/)
        .map(word => word[0]?.toUpperCase()).filter((c, i) => i < 2)
        .join('');

    // 2. Price into two parts (e.g., 1349 => 13/49)
    const priceStr = String(price);
    const mid = Math.floor(priceStr.length / 2);
    const pricePart = priceStr.slice(0, mid) + "/" + priceStr.slice(mid);

    // 3. Option values first letters
    const optionPart = optionValues
        // .map(v => v?.trim()[0]?.toUpperCase() || "")
        .join('');

    // Final SKU
    return `${titlePart}-${pricePart}-${optionPart}`;
}

export function generateSKU_new({
    trait,
    age,        // "04Y", "12M"
    item,       // "t-shirt"
    color,      // "blue"
    size = "",  // optional
    series = "",// optional
}) {
    const traitCode = traits[trait.toLowerCase()] || "GD"; // GD = Good
    const itemCode = items[item.toLowerCase()] || "OT";
    const colorCode = colors[color.toLowerCase()] || "MX";

    let sku = `${traitCode}-${age}-${itemCode}-${colorCode}`;

    if (size) sku += `-${size}`;
    if (series) sku += `-${series.toUpperCase()}`;

    return sku;
}

export const mapVariantPayload = (v, extra = {}) => ({
    ...extra,
    title: [v.option1, v.option2, v.option3].filter(Boolean).join(" / "),
    active: v.active,
    sku: v.sku || "",
    option1: v.option1 || null,
    option2: v.option2 || null,
    option3: v.option3 || null,
    cost: Number(v.cost || 0),
    price: Number(v.price || 0),
    markupPercentage: Number(v.markupPercentage || 0),
    autoPriceEnabled: Boolean(v.autoPriceEnabled),
    stock: Number(v.stock || 0),
    weight: Number(v.weight || 0),
    weightUnit: v.weightUnit || "kg",
    requiresShipping: Boolean(v.requiresShipping),
    lowStockThreshold: v.lowStockThreshold ?? null,
    image: v.image || null
});