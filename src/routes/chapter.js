const router = require("express").Router();
const ChapterController = require("../controllers/ChapterController");

const MiddleWareController = require("../controllers/MiddleWareController");

router.post(
    "/create/:slug",
    MiddleWareController.verifyAdmin,
    ChapterController.createChapter
);
router.post(
    "/createindex/:slug",
    MiddleWareController.verifyAdmin,
    ChapterController.createInIndexPosition
);
router.post(
    "/update/:id",
    MiddleWareController.verifyAdmin,
    ChapterController.updateChapter
);
router.delete(
    "/delete/:id",
    MiddleWareController.verifyAdmin,
    ChapterController.deleteChapter
);

module.exports = router;
