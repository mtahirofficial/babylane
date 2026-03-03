const AuthMiddleware = require("./auth.middleware");
const LoggerMiddleware = require("./logger.middleware");
const ErrorsMiddleware = require("./errors.middleware");
const WooWebhookAuthMiddleware = require("./woo-webhook-auth.middleware");

module.exports = {
	AuthMiddleware,
	LoggerMiddleware,
	ErrorsMiddleware,
	WooWebhookAuthMiddleware
};
