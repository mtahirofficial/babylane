const express = require("express");
const { Customer, Order, Product, Variant } = require("../models");
const { ServerException } = require("../exceptions");
const { Op } = require("sequelize");
const { fn, col } = require("sequelize");

class StatsController {
    _path = "/stats";
    _router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    async getData(req, res, next) {
        try {
            const toNumber = (value) => {
                const parsed = Number(value);
                return Number.isFinite(parsed) ? parsed : 0;
            };

            const [products, orders, customers, sales, variants, lowStock, outOfStock, recentProducts, recentOrdersForChart, recentProductsForChart] = await Promise.all([
                Product.count(),
                Order.count(),
                Customer.count(),
                Order.findOne({
                    attributes: [[fn("SUM", col("total")), "totalSales"]],
                    raw: true
                }),
                Variant.findAll({
                    attributes: ["regular_price", "stock_quantity"],
                    raw: true
                }),
                Product.findAll({
                    where: {
                        stock_quantity: {
                            [Op.gt]: 0,
                            [Op.lte]: 5
                        }
                    },
                    attributes: ["id", "title", "sku", "stock_quantity"],
                    order: [["stock_quantity", "ASC"], ["updatedAt", "DESC"]],
                    limit: 5,
                    raw: true
                }),
                Product.findAll({
                    where: {
                        [Op.or]: [
                            { stock_quantity: { [Op.lte]: 0 } },
                            { stock_status: { [Op.in]: ["outofstock", "out_of_stock"] } }
                        ]
                    },
                    attributes: ["id", "title", "sku"],
                    order: [["updatedAt", "DESC"]],
                    limit: 5,
                    raw: true
                }),
                Product.findAll({
                    attributes: ["id", "title", "createdAt"],
                    order: [["createdAt", "DESC"]],
                    limit: 5,
                    raw: true
                }),
                Order.findAll({
                    where: { createdAt: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) } },
                    attributes: ["createdAt"],
                    raw: true
                }),
                Product.findAll({
                    where: { createdAt: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) } },
                    attributes: ["createdAt"],
                    raw: true
                })
            ]);

            const totalCosts = variants.reduce((acc, v) => {
                return acc + (toNumber(v.regular_price) * toNumber(v.stock_quantity));
            }, 0);
            const totalSales = toNumber(sales?.totalSales);

            const lowStockProducts = lowStock.map((p) => ({
                id: p.id,
                name: p.title || "Untitled Product",
                sku: p.sku || "-",
                stock: toNumber(p.stock_quantity)
            }));

            const outOfStockProducts = outOfStock.map((p) => ({
                id: p.id,
                name: p.title || "Untitled Product",
                sku: p.sku || "-"
            }));

            const recentProductsList = recentProducts.map((p) => ({
                id: p.id,
                name: p.title || "Untitled Product"
            }));

            const monthKeys = [];
            const now = new Date();
            for (let i = 5; i >= 0; i -= 1) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
            }

            const chartMap = {};
            monthKeys.forEach((key) => {
                const [year, month] = key.split("-").map(Number);
                const labelDate = new Date(year, month - 1, 1);
                chartMap[key] = {
                    month: labelDate.toLocaleString("en-US", { month: "short" }),
                    stockIn: 0,
                    stockOut: 0
                };
            });

            recentProductsForChart.forEach((item) => {
                const d = new Date(item.createdAt);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                if (chartMap[key]) chartMap[key].stockIn += 1;
            });

            recentOrdersForChart.forEach((item) => {
                const d = new Date(item.createdAt);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                if (chartMap[key]) chartMap[key].stockOut += 1;
            });

            const stockChartData = monthKeys.map((key) => chartMap[key]);

            res.json({
                customers,
                orders,
                products,
                totalSales: Number(totalSales.toFixed(2)),
                totalCosts: Number(totalCosts.toFixed(2)),
                lowStockProducts,
                recentProducts: recentProductsList,
                outOfStockProducts,
                stockChartData
            });
        } catch (error) {
            console.log(error.message);
            next(new ServerException(error.message));
        }
    };

    initializeRoutes() {
        this._router.get(`${this._path}`, this.getData.bind(this));
    }
}

module.exports = StatsController;
