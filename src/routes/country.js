const router = require("express").Router();
const CountryController = require("../controllers/CountryController");
const MiddleWareController = require("../controllers/MiddleWareController");
router.get("/", CountryController.getcountry);
router.post(
    "/create",
    MiddleWareController.verifyAdmin,
    CountryController.createcountry
);
router.delete(
    "/delete/:id",
    MiddleWareController.verifyAdmin,
    CountryController.deletecountry
);

module.exports = router;
