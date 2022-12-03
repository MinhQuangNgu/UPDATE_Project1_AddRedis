const router = require("express").Router();
const MessageController = require("../controllers/MessageController");
const MiddeWareController = require("../controllers/MiddleWareController");

router.delete(
    "/delete/:id",
    MiddeWareController.verifyToken,
    MessageController.deleteMessage
);
router.get("/:slug", MessageController.getMessage);

module.exports = router;
