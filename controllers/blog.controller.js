const express = require("express");
const { Blog, User, Comment, Like } = require("../models");
const { AuthMiddleware } = require("../middleware");
const { ServerException, NotFoundException, ForbiddenException } = require("../exceptions");
const { Op } = require("sequelize");
const { calculateReadTime } = require("../utils");

class BlogController {
    _path = "/blogs";
    _router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    async getAll(req, res, next) {
        try {
            let { page = 1, limit = 3, search = "" } = req.query;

            page = parseInt(page);
            limit = parseInt(limit);
            const offset = (page - 1) * limit;

            // SEARCH conditions
            const where = {};

            if (search.trim() !== "") {
                where[Op.or] = [
                    { title: { [Op.like]: `%${search}%` } },
                    { excerpt: { [Op.like]: `%${search}%` } },
                    { content: { [Op.like]: `%${search}%` } },
                    { category: { [Op.like]: `%${search}%` } },
                ];
            }

            // Count total with same search
            const totalBlogs = await Blog.count({ where });

            // Fetch blogs with pagination + search + author search
            const blogs = await Blog.findAll({
                where,
                include: [
                    {
                        model: User,
                        attributes: ["id", "name", "email"],
                        where: search.trim() !== "" ? {
                            name: { [Op.like]: `%${search}%` }
                        } : undefined,
                        required: false // IMPORTANT: don't block results
                    },
                    {
                        model: Comment,
                        include: [{ model: User, attributes: ["id", "name"] }]
                    },
                    { model: Like }
                ],
                order: [["createdAt", "DESC"]],
                limit,
                offset
            });

            const result = blogs.map(blog => ({
                ...blog.toJSON(),
                likesCount: blog.Likes.length
            }));

            res.json({
                status: 200,
                message: "success",
                blogs: result,
                pagination: {
                    total: totalBlogs,
                    page,
                    limit,
                    totalPages: Math.ceil(totalBlogs / limit)
                }
            });

        } catch (error) {
            next(new ServerException(error.message));
        }
    }


    async getOne(req, res, next) {
        try {
            const blog = await Blog.findByPk(req.params.id, {
                include: [
                    { model: User, attributes: ["id", "name", "email"] },
                    { model: Comment, include: [{ model: User, attributes: ["id", "name"] }] },
                    { model: Like }
                ]
            });

            if (!blog) return next(new NotFoundException("Blog not found"));

            const result = { ...blog.toJSON(), likesCount: blog.Likes.length };

            res.json({ status: 200, message: "success", blog: result });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    async create(req, res, next) {
        try {
            const { author, title, excerpt, content, category, readTime, date } = req.body;
            const userId = req.user.id;
            console.log(req.body);

            const blog = await Blog.create({ author, title, excerpt, content, category, readTime: calculateReadTime(content), userId });
            res.json({ status: 201, message: "Blog created", blog: blog });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    async update(req, res, next) {
        try {
            const blog = await Blog.findByPk(req.params.id);
            if (!blog) return next(new NotFoundException("Blog not found"));
            if (blog.userId !== req.user.id) return next(new ForbiddenException("Not allowed"));

            const { title, excerpt, content, category, readTime, date } = req.body;
            await blog.update({ title, excerpt, content, category, readTime, date });

            res.json({ status: 200, message: "Blog updated", data: blog });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    async delete(req, res, next) {
        try {
            const blog = await Blog.findByPk(req.params.id);
            if (!blog) return next(new NotFoundException("Blog not found"));
            if (blog.userId !== req.user.id) return next(new ForbiddenException("Not allowed"));

            await blog.destroy();
            res.json({ status: 200, message: "Blog deleted" });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    initializeRoutes() {
        this._router.get(`${this._path}`, this.getAll.bind(this));
        this._router.get(`${this._path}/:id`, this.getOne.bind(this));
        this._router.post(`${this._path}`, AuthMiddleware, this.create.bind(this));
        this._router.put(`${this._path}/:id`, AuthMiddleware, this.update.bind(this));
        this._router.delete(`${this._path}/:id`, AuthMiddleware, this.delete.bind(this));
    }
}

module.exports = BlogController;
