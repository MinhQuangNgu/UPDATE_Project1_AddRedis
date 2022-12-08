const router = require("express").Router();
const ReportController = require("../controllers/ReportController");

const MiddleWareController = require("../controllers/MiddleWareController");

router.get("/", MiddleWareController.verifyAdmin, ReportController.getReports);

module.exports = router;
