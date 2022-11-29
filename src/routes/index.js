const user = require("./user");
const kind = require("./kind");
const country = require("./country");
function router(app) {
    app.use("/api/auth", user);
    app.use("/api/kind", kind);
    app.use("/api/country", country);
}

module.exports = router;
