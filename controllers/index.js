const fs = require("fs");
const path = require("path");

const controllerFiles = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith(".controller.js") && file !== "index.js")
    .sort();

const controllers = {};

for (const file of controllerFiles) {
    const Controller = require(path.join(__dirname, file));

    if (typeof Controller !== "function" || !Controller.name) {
        continue;
    }

    controllers[Controller.name] = Controller;
}

module.exports = controllers;
