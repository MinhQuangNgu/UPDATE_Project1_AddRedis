const user = require("./user");
function router(app) {
    app.use("/api/auth", user);
}

module.exports = router;
