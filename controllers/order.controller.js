const express = require("express");
const { Customer, Order, OrderItem, Variant, sequelize } = require("../models");
const { Op } = require("sequelize");
const { AuthMiddleware } = require("../middleware");
const {
    ServerException,
    NotFoundException,
    ForbiddenException
} = require("../exceptions");

class OrderController {
    _path = "/orders";
    _router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    buildDateRange(period, startDate, endDate) {
        const now = new Date();
        let rangeStart;
        let rangeEnd;
        const parseDateOnly = (value) => {
            const parts = String(value || "").split("-").map(Number);
            if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
            const [year, month, day] = parts;
            return new Date(year, month - 1, day);
        };

        switch ((period || "month").toLowerCase()) {
            case "day": {
                rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                break;
            }
            case "week": {
                const day = now.getDay(); // 0 = Sun, 1 = Mon
                const diffToMonday = day === 0 ? -6 : 1 - day;
                rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
                rangeEnd = new Date(rangeStart);
                rangeEnd.setDate(rangeStart.getDate() + 6);
                rangeEnd.setHours(23, 59, 59, 999);
                break;
            }
            case "month": {
                rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
                rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            }
            case "year": {
                rangeStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
                rangeEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            }
            case "custom": {
                if (!startDate || !endDate) {
                    throw new Error("startDate and endDate are required for custom period");
                }

                const parsedStart = parseDateOnly(startDate);
                const parsedEnd = parseDateOnly(endDate);

                if (!parsedStart || !parsedEnd || Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
                    throw new Error("Invalid startDate or endDate");
                }

                rangeStart = new Date(parsedStart.getFullYear(), parsedStart.getMonth(), parsedStart.getDate(), 0, 0, 0, 0);
                rangeEnd = new Date(parsedEnd.getFullYear(), parsedEnd.getMonth(), parsedEnd.getDate(), 23, 59, 59, 999);

                if (rangeStart > rangeEnd) {
                    throw new Error("startDate cannot be after endDate");
                }
                break;
            }
            default: {
                throw new Error("Invalid period. Use day, week, month, year, or custom");
            }
        }

        return { rangeStart, rangeEnd };
    }

    // ------------------------------------------------------
    // GET SALES REPORT
    // ------------------------------------------------------
    async getSalesReport(req, res, next) {
        try {
            const { period = "month", startDate, endDate } = req.query;
            const { rangeStart, rangeEnd } = this.buildDateRange(period, startDate, endDate);

            const soldItems = await OrderItem.findAll({
                include: [
                    {
                        model: Order,
                        required: true,
                        attributes: ["id", "orderNumber", "createdAt"],
                        where: {
                            createdAt: {
                                [Op.between]: [rangeStart, rangeEnd]
                            }
                        }
                    },
                    {
                        model: Variant,
                        required: false,
                        attributes: ["id", "regular_price"]
                    }
                ],
                order: [["createdAt", "DESC"]]
            });

            const reportMap = new Map();

            soldItems.forEach((item) => {
                const quantity = Number(item.quantity || 0);
                const saleUnitPrice = Number(item.price || 0);
                const purchaseUnitPrice = Number(item.Variant?.regular_price || 0);
                const saleTotal = Number(item.total || saleUnitPrice * quantity);
                const purchaseTotal = Number((purchaseUnitPrice * quantity).toFixed(2));
                const profitLoss = Number((saleTotal - purchaseTotal).toFixed(2));

                const key =
                    item.variantId != null
                        ? `variant-${item.variantId}`
                        : item.productId != null
                            ? `product-${item.productId}`
                            : `item-${item.title || "unknown"}-${item.sku || "na"}`;

                if (!reportMap.has(key)) {
                    reportMap.set(key, {
                        key,
                        productId: item.productId || null,
                        variantId: item.variantId || null,
                        title: item.title || "Untitled Product",
                        sku: item.sku || "-",
                        quantity: 0,
                        purchaseTotal: 0,
                        saleTotal: 0
                    });
                }

                const current = reportMap.get(key);
                current.quantity += quantity;
                current.purchaseTotal += purchaseTotal;
                current.saleTotal += saleTotal;
            });

            const items = Array.from(reportMap.values())
                .map((row) => {
                    const quantity = Number(row.quantity || 0);
                    const purchaseTotal = Number(row.purchaseTotal.toFixed(2));
                    const saleTotal = Number(row.saleTotal.toFixed(2));
                    const purchasePrice = quantity > 0 ? Number((purchaseTotal / quantity).toFixed(2)) : 0;
                    const salePrice = quantity > 0 ? Number((saleTotal / quantity).toFixed(2)) : 0;
                    const profitLoss = Number((saleTotal - purchaseTotal).toFixed(2));

                    return {
                        ...row,
                        purchasePrice,
                        salePrice,
                        purchaseTotal,
                        saleTotal,
                        profitLoss
                    };
                })
                .sort((a, b) => b.saleTotal - a.saleTotal);

            const totals = items.reduce(
                (acc, row) => {
                    acc.totalQuantity += Number(row.quantity || 0);
                    acc.totalPurchase += Number(row.purchaseTotal || 0);
                    acc.totalSales += Number(row.saleTotal || 0);
                    return acc;
                },
                { totalQuantity: 0, totalPurchase: 0, totalSales: 0 }
            );

            totals.totalPurchase = Number(totals.totalPurchase.toFixed(2));
            totals.totalSales = Number(totals.totalSales.toFixed(2));
            totals.profitLoss = Number((totals.totalSales - totals.totalPurchase).toFixed(2));

            res.json({
                period: period.toLowerCase(),
                startDate: rangeStart,
                endDate: rangeEnd,
                items,
                totals
            });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    // ------------------------------------------------------
    // GET ALL ORDERS
    // ------------------------------------------------------
    async getAllOrders(req, res, next) {
        try {
            const orders = await Order.findAll({
                include: [
                    { model: Customer, as: "customer" }, // include customer details
                    { model: OrderItem, as: "items" }   // include order items
                ],
                order: [["createdAt", "DESC"]]
            });
            res.json(orders);
        } catch (error) {
            next(new ServerException(error.message));
        }
    }


    // ------------------------------------------------------
    // GET ONE ORDER
    // ------------------------------------------------------
    async getOneOrder(req, res, next) {
        try {
            const { id } = req.params;

            const order = await Order.findOne({
                where: { id },
                include: OrderItem
            });

            if (!order) return next(new NotFoundException("Order not found"));

            res.json(order);
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    // ------------------------------------------------------
    // CREATE ORDER
    // ------------------------------------------------------
    async createOrder(req, res, next) {
        const t = await sequelize.transaction();

        try {
            const { notes = "", customer = {}, items = [] } = req.body || {};

            if (!customer || !customer.phone) {
                return next(new ServerException("Customer data is required"));
            }

            if (!Array.isArray(items) || items.length === 0) {
                return next(new ServerException("Order items are required"));
            }

            /* =========================
               FIND OR CREATE CUSTOMER
            ========================= */
            const [savedCustomer] = await Customer.findOrCreate({
                where: { phone: customer.phone },
                defaults: {
                    name: customer.name || "",
                    email: customer.email || "",
                    address: customer.address || "",
                    city: customer.city || "",
                    state: customer.state || "",
                    postalCode: customer.postalCode || "",
                    country: customer.country || ""
                },
                transaction: t
            });

            /* =========================
               CALCULATE TOTAL
            ========================= */
            const subtotal = items.reduce(
                (sum, i) => sum + Number(i.total || 0),
                0
            );

            /* =========================
               CREATE ORDER
            ========================= */
            const order = await Order.create(
                {
                    customerId: savedCustomer.id,
                    subtotal,
                    total: subtotal,
                    status: "pending",
                    notes,
                    orderNumber: "ORD-" + Date.now(),
                    userId: req.user.id
                },
                { transaction: t }
            );

            /* =========================
               CREATE ORDER ITEMS
            ========================= */
            const orderItems = items.map(item => ({
                orderId: order.id,
                productId: item.productId,
                variantId: item.variantId,
                title: item.title,
                price: Number(item.price),
                quantity: Number(item.quantity),
                total: Number(item.total)
            }));

            await OrderItem.bulkCreate(orderItems, { transaction: t });
            await t.commit();

            res.json({
                orderId: order.id,
                message: "Order created successfully"
            });

        } catch (error) {
            await t.rollback();
            next(new ServerException(error.message));
        }
    }


    // ------------------------------------------------------
    // UPDATE ORDER STATUS
    // ------------------------------------------------------
    async updateOrder(req, res, next) {
        try {
            const { id } = req.params;

            const order = await Order.findByPk(id);
            if (!order) return next(new NotFoundException("Order not found"));

            await order.update(req.body);

            res.json(order);
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    // ------------------------------------------------------
    // DELETE ORDER
    // ------------------------------------------------------
    async deleteOrder(req, res, next) {
        try {
            const { id } = req.params;

            const order = await Order.findByPk(id);
            if (!order) return next(new NotFoundException("Order not found"));

            await OrderItem.destroy({ where: { orderId: id } });
            await order.destroy();

            res.json({ message: "Order deleted" });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    // ------------------------------------------------------
    // ROUTES
    // ------------------------------------------------------
    initializeRoutes() {
        this._router.get(`${this._path}`, AuthMiddleware, this.getAllOrders.bind(this));
        this._router.get(`${this._path}/sales-report`, AuthMiddleware, this.getSalesReport.bind(this));
        this._router.get(`${this._path}/:id`, AuthMiddleware, this.getOneOrder.bind(this));
        this._router.post(`${this._path}`, AuthMiddleware, this.createOrder.bind(this));
        this._router.put(`${this._path}/:id`, AuthMiddleware, this.updateOrder.bind(this));
        this._router.delete(`${this._path}/:id`, AuthMiddleware, this.deleteOrder.bind(this));
    }
}

module.exports = OrderController;
