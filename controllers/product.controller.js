const express = require("express");
const models = require("../models");
const { Product } = models;
const { AuthMiddleware } = require("../middleware");
const MulterMiddleware = require("../middleware/multer.middleware");
const { ServerException, NotFoundException, ForbiddenException } = require("../exceptions");
const { Op } = require("sequelize");
const { ProductService } = require("../services");

class ProductController {
    _path = "/products";
    _router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    async getAllProducts(req, res, next) {
        try {
            const { q } = req.query;

            const where = {};
            if (q) {
                where[Op.or] = [
                    { title: { [Op.like]: `%${q}%` } },
                    { sku: { [Op.like]: `%${q}%` } },
                ];
            }

            const products = await Product.findAll({
                where,
                order: [["createdAt", "DESC"]]
            });

            res.json(products);
        } catch (error) {
            console.log("error.message", error.message);
            next(new ServerException(error.message));
        }
    }

    async getOneProduct(req, res, next) {
        try {
            const product = await Product.findByPk(req.params.id);

            if (!product) {
                return next(new NotFoundException("Product not found"));
            }

            res.json(product);
        } catch (error) {
            next(new ServerException(error.message));
        }
    }


    async createProduct(req, res, next) {
        try {
            const product = await ProductService.create(req.body, req.file, req);
            res.json({ product });
        } catch (e) {
            next(new ServerException(e.message));
        }
    };

    async updateProduct(req, res, next) {
        try {
            const productId = Number(req.params.id);
            const product = await ProductService.update(productId, req.body, req.file, req);
            res.json({ product });
        } catch (e) {
            next(new ServerException(e.message));
        }
    }

    // async updateProduct(req, res, next) {
    //     try {
    //         const { id } = req.params;
    //         console.log("req.body", req.body);
    //         // whitelist only actual Product model attributes to avoid validation/sql errors
    //         const attrs = Object.keys(Product.rawAttributes || {});
    //         const body = req.body || {};
    //         const payload = {};
    //         for (const k of attrs) {
    //             if (Object.prototype.hasOwnProperty.call(body, k)) {
    //                 payload[k] = body[k];
    //             }
    //         }

    //         // handle tags if provided as string
    //         if (payload.tags && typeof payload.tags === 'string') {
    //             try {
    //                 payload.tags = JSON.parse(payload.tags);
    //             } catch (e) {
    //                 payload.tags = String(payload.tags).split(',').map(t => t.trim()).filter(Boolean);
    //             }
    //         }

    //         // coerce numeric fields if present
    //         ['costPrice', 'salePrice', 'markupPercentage', 'dc', 'stock', 'lowStockThreshold', 'userId'].forEach(field => {
    //             if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') {
    //                 const n = Number(payload[field]);
    //                 if (!Number.isNaN(n)) payload[field] = n;
    //             }
    //         });

    //         // if a file was uploaded via Multer, set mainImage to its URL (prefer uploaded file)
    //         if (req.file) {
    //             payload.mainImage = `${req.protocol}://${req.get('host')}${MulterMiddleware.baseFilePath}${req.file.filename}`;
    //         } else if (body.mainImage) {
    //             // keep existing mainImage if provided as a field
    //             payload.mainImage = body.mainImage;
    //         }

    //         // ensure we have something to update
    //         if (!Object.keys(payload).length) {
    //             // helpful debug: show incoming body and allowed attrs
    //             console.warn('updateProduct: no valid fields in payload. body:', body);
    //             console.warn('updateProduct: allowed Product attrs:', attrs);
    //             return res.status(400).json({ error: 'No valid product fields provided to update', allowedFields: attrs });
    //         }

    //         // pre-validate with Sequelize model to surface validation errors early
    //         try {
    //             const instance = Product.build(payload);
    //             await instance.validate();
    //         } catch (valErr) {
    //             if (valErr && Array.isArray(valErr.errors)) {
    //                 return res.status(400).json({ error: 'Validation error', details: valErr.errors.map(e => ({ message: e.message, path: e.path, value: e.value })) });
    //             }
    //             // if not standard, fall through to main handler
    //             console.error('pre-validate error:', valErr);
    //         }

    //         await Product.update(payload, { where: { id } });
    //         const updated = await Product.findByPk(id);
    //         res.json(updated);
    //     } catch (error) {
    //         console.error('updateProduct error:', error && (error.stack || error.message || error));

    //         // Sequelize validation/constraint errors often include `errors` array
    //         if (error && Array.isArray(error.errors) && error.errors.length > 0) {
    //             return res.status(400).json({ error: error.name || 'Validation error', details: error.errors.map(e => ({ message: e.message, path: e.path, value: e.value })) });
    //         }

    //         // Database errors may have parent.sqlMessage or message
    //         if (error && error.parent && (error.parent.sqlMessage || error.parent.message)) {
    //             return res.status(400).json({ error: 'Database error', message: error.parent.sqlMessage || error.parent.message });
    //         }

    //         // Fallback: return generic validation error message and log full error
    //         if (error && /validation/i.test(error.message || '')) {
    //             return res.status(400).json({ error: 'Validation error', message: error.message });
    //         }

    //         next(new ServerException(error.message));
    //     }
    // };

    async deleteProduct(req, res, next) {
        try {
            const { id } = req.params;
            await Product.destroy({ where: { id } });
            res.json({ message: "Deleted" });
        } catch (error) {
            next(new ServerException(error.message));
        }
    };

    async uploadImage(req, res, next) {
        try {
            // multer stores file metadata on req.file
            if (!req.file) return res.status(400).json({ error: "File missing" });
            const filePath = `${req.protocol}://${req.get("host")}${MulterMiddleware.baseFilePath}${req.file.filename}`;
            return res.json({ url: filePath });
        } catch (error) {
            next(new ServerException(error.message));
        }
    };

    initializeRoutes() {
        this._router.get(`${this._path}`, this.getAllProducts.bind(this));
        this._router.get(`${this._path}/:id`, this.getOneProduct.bind(this));
        // Accept single file on create so client can send product + image in one request
        this._router.post(`${this._path}`, AuthMiddleware, MulterMiddleware.upload.single("file"), this.createProduct.bind(this));
        // this._router.post(`${this._path}/upload`, AuthMiddleware, MulterMiddleware.upload.single("file"), this.uploadImage.bind(this));
        // Accept multipart/form-data on update as well (file + fields)
        this._router.put(`${this._path}/:id`, AuthMiddleware, MulterMiddleware.upload.single("file"), this.updateProduct.bind(this));
        this._router.delete(`${this._path}/:id`, AuthMiddleware, this.deleteProduct.bind(this));
    }
}

module.exports = ProductController;
