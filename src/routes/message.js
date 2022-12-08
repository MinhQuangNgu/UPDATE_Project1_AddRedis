const router = require("express").Router();
const MessageController = require("../controllers/MessageController");
const MiddeWareController = require("../controllers/MiddleWareController");

router.delete(
    "/delete/admin/:id",
    MiddeWareController.verifyAdmin,
    MessageController.deleteMessageAdmin
);
router.delete(
    "/delete/:id",
    MiddeWareController.verifyToken,
    MessageController.deleteMessage
);
router.delete(
    "/delete/:parentid/:id",
    MiddeWareController.verifyToken,
    MessageController.deleteChild
);
router.get("/:slug", MessageController.getMessage);

module.exports = router;
