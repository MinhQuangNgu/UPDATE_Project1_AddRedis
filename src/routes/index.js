const user = require("./user");
const kind = require("./kind");
const country = require("./country");
const product = require("./product");
const chapter = require("./chapter");
function router(app) {
    app.use("/api/auth", user);
    app.use("/api/kind", kind);
    app.use("/api/country", country);
    app.use("/api/chapter", chapter);
    app.use("/api/movie", product);
}

module.exports = router;
