const jwt = require("jsonwebtoken");
const { UnauthorizedException } = require("../exceptions");

async function AuthMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(new UnauthorizedException("Authorization header missing"));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next(new UnauthorizedException("Token not provided"));
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return next(new UnauthorizedException("ACCESS_TOKEN_EXPIRED"));
        }
        return next(new UnauthorizedException("INVALID_OR_MALFORMED_TOKEN"));
      }

      req.user = user;
      next();
    });

  } catch (error) {
    next(new UnauthorizedException("Authentication failed"));
  }
};

module.exports = AuthMiddleware;
