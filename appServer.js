const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const { join } = require("path");
const { ErrorsMiddleware, LoggerMiddleware } = require("./middleware");
const { ConsoleLogger } = require("./core");
const path = require("path");
const cron = require('node-cron');
const cookieParser = require("cookie-parser");

// This runs every day at midnight
cron.schedule('0 0 * * *', () => {

});

class AppServer {
    _app = express();
    _port = 5000;
    _server;

    constructor(controllers = []) {
        dotenv.config();
        this.initMiddleWares();
        this.enableStaticFile();
        this.initLogger();
        this.initializeControllers(controllers);
        this.initErrorHandling();
        if (process.env.IS_SSR) {
            this.loadSSRView();
        }
    }

    buildCorsOpt() {
        const configCors = process.env.CORS_ALLOW_ORIGINS;
        if (!configCors) {
            throw new Error("ENV CORS not provider!");
        }
        return {
            origin: configCors,
            methods: "OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE",
            preflightContinue: false,
            optionsSuccessStatus: 204,
            credentials: true,
        };
    }

    captureRawBody(req, res, buf) {
        if (buf && buf.length) {
            req.rawBody = Buffer.from(buf);
        }
    }

    initMiddleWares() {
        this._app.use(cors(this.buildCorsOpt()));
        this._app.use(bodyParser.json({
            limit: "50mb",
            verify: this.captureRawBody
        }));
        this._app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

    }

    loadSSRView() {
        this._app.use("/static", express.static(join(__dirname, "./client/build/static")));
        // this._app.get("/*", (req, res) => {
        //     res.sendFile('index.html', { root: path.join(__dirname, './client/build/') }, err => {
        //         if (err) res.send(`<div style="text-align: center;font-size: xxx-large;color: red;margin-top: 100px;">Maintenance in progress...</div><div style="text-align: center;font-size: 16px;color: red;margin-top: 20px;">Checkout is functional just app dashboard in maintenance.</div>`);
        //         res.end();
        //     });
        // });
    }

    initErrorHandling() {
        this._app.use(ErrorsMiddleware);
    }

    initLogger() {
        this._app.use(LoggerMiddleware);
    }

    enableStaticFile() {
        this._app.use(express.static(join(__dirname, "public")));
        // Serve uploaded files directory so saved images are accessible
        this._app.use("/files", express.static(join(__dirname, "files")));
    }

    initializeControllers(controllers = []) {
        this._app.use(cookieParser());
        this._app.use(express.json({ verify: this.captureRawBody }));

        this._app.use((req, res, next) => {
            res.header("Access-Control-Allow-Credentials", "true");
            next();
        });
        this._app.get("/test", (req,res) =>{
            res.json('This is test route!')
        })
        controllers.forEach((c) => {
            this._app.use("/api", c._router);
        });
    }

    startListening() {
        const PORT = process.env.PORT || this._port;
        this._server = this._app.listen(PORT, () => {
            ConsoleLogger.info(`Server started on ${PORT}!`);
        });
        // new SocketServer(this._server);
    }
}

module.exports = AppServer;
