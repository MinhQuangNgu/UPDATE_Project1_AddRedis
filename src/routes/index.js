const user = require("./user");
const kind = require("./kind");
const country = require("./country");
const product = require("./product");
const chapter = require("./chapter");
const message = require("./message");
function router(app) {
    app.use("/api/auth", user);
    app.use("/api/kind", kind);
    app.use("/api/country", country);
    app.use("/api/chapter", chapter);
    app.use("/api/movie", product);
    app.use("/api/message", message);
}

module.exports = router;
