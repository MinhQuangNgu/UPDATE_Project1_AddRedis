const router = require("express").Router();
const ChapterController = require("../controllers/ChapterController");

const MiddleWareController = require("../controllers/MiddleWareController");

router.post(
    "/create/:slug",
    MiddleWareController.verifyAdmin,
    ChapterController.createChapter
);

module.exports = router;
