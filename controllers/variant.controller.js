const express = require("express");
const models = require("../models");
const { Variant } = models;
const productService = require('../services/product.old.service');
const { AuthMiddleware } = require("../middleware");
const { ServerException, NotFoundException, ForbiddenException } = require("../exceptions");
const { VariantService } = require("../services");

class VariantController {
    _path = "/variants";
    _router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    async getAllVariants(req, res, next) {
        try {
            const variants = await Variant.findAll();
            res.json(variants);
        } catch (error) {
            next(new ServerException(error.message));
        }
    };

    async getOneVariant(req, res, next) {
        try {
            const variant = await Variant.findByPk(req.params.id);
            if (!variant) {
                return next(new NotFoundException("Variant not found"));
            }
            res.json(variant);
        } catch (error) {
            next(new ServerException(error.message));
        }
    };

    async createVariant(req, res, next) {
        try {
            const { productId, cost, price, markupPercentage, autoPriceEnabled, stock, weight, ...rest } = req.body;

            const variant = await Variant.create({
                productId: productId || null,
                cost: cost || 0,
                price: price || 0,
                markupPercentage: markupPercentage || 0,
                autoPriceEnabled: autoPriceEnabled !== undefined ? autoPriceEnabled : true,
                stock: stock || 0,
                weight: weight || 0,
                ...rest
            });
            res.json({ variant });
        } catch (error) {
            next(new ServerException(error.message));
        }
    };

    async createVariants(req, res, next) {
        try {
            const { variants } = req.body;
            const created = await VariantService.bulkCreate(variants);
            res.json({ variants: created });
        } catch (e) {
            next(new ServerException(e.message));
        }
    };

    async updateVariant(req, res, next) {
        try {
            const id = Number(req.params.id);
            const variant = await VariantService.update(id, req.body);
            res.json({ variant });
        } catch (e) {
            next(new ServerException(e.message));
        }
    };

    async sync(req, res, next) {
        try {
            const { productId, keepVariantIds } = req.body;
            await VariantService.syncDeleted(productId, keepVariantIds);
            res.json({ success: true });
        } catch (e) {
            next(new ServerException(e.message));
        }
    }

    async deleteVariant(req, res, next) {
        try {
            const { id } = req.params;
            await Variant.destroy({ where: { id } });
            res.json({ message: "Variant deleted successfully" });
        } catch (error) {
            next(new ServerException(error.message));
        }
    };

    initializeRoutes() {
        this._router.get(`${this._path}`, this.getAllVariants.bind(this));
        this._router.get(`${this._path}/:id`, this.getOneVariant.bind(this));
        this._router.post(`${this._path}`, AuthMiddleware, this.createVariants.bind(this));
        this._router.post(`${this._path}/sync`, AuthMiddleware, this.sync.bind(this));
        this._router.put(`${this._path}/:id`, AuthMiddleware, this.updateVariant.bind(this));
        this._router.delete(`${this._path}/:id`, AuthMiddleware, this.deleteVariant.bind(this));
    }
}

module.exports = VariantController;
