const express = require("express");
const { Comment, User, Blog } = require("../models");
const { AuthMiddleware } = require("../middleware");
const { ServerException, NotFoundException, ForbiddenException } = require("../exceptions");

class CommentController {
    _path = "/comments";
    _router = express.Router();

    constructor() {
        this.initializeRoutes();
    }

    async create(req, res, next) {
        try {
            const { content } = req.body;
            const userId = req.user.id;
            const blogId = req.params.blogId;

            const blog = await Blog.findByPk(blogId);
            if (!blog) return next(new NotFoundException("Blog not found"));

            const comment = await Comment.create({ content, userId, blogId, date: new Date() });

            const fullComment = await Comment.findByPk(comment.id, {
                include: [{ model: User, attributes: ["id", "name"] }]
            });

            res.json({ status: 201, message: "Comment created", comment: fullComment });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    async delete(req, res, next) {
        try {
            const comment = await Comment.findByPk(req.params.id);
            if (!comment) return next(new NotFoundException("Comment not found"));
            if (comment.userId !== req.user.id) return next(new ForbiddenException("Not allowed"));

            await comment.destroy();
            res.json({ status: 200, message: "Comment deleted" });
        } catch (error) {
            next(new ServerException(error.message));
        }
    }

    initializeRoutes() {
        this._router.post(`${this._path}/:blogId`, AuthMiddleware, this.create.bind(this));
        this._router.delete(`${this._path}/:id`, AuthMiddleware, this.delete.bind(this));
    }
}

module.exports = CommentController;
