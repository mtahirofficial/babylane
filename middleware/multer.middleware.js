const multer = require("multer");
const path = require("path");

const uniqueSuffix = Date.now();
const generateFileName = (f) => {
    return f.fieldname + "-" + f.originalname
    return f.fieldname + "-" + f.originalname + "." + f.mimetype.split("/")[1]
};
const directory = "files"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, `../${directory}`));
    },
    filename: function (req, file, cb) {
        console.log("file", file);
        const imageName = generateFileName(file)
        console.log("imageName", imageName);
        cb(null, imageName);
    },
});
const upload = multer({ storage: storage });
const baseFilePath = `/${directory}/`;

const generateFilePath = file => `/${directory}/${generateFileName(file)}`;

const MulterMiddleware = { upload, baseFilePath, generateFileName, generateFilePath }

module.exports = MulterMiddleware