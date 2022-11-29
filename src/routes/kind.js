const router = require("express").Router();
const KindController = require("../controllers/KindController");
const MiddleWareController = require("../controllers/MiddleWareController");
router.get("/", KindController.getKind);
router.post(
    "/create",
    MiddleWareController.verifyAdmin,
    KindController.createKind
);
router.delete(
    "/delete/:id",
    MiddleWareController.verifyAdmin,
    KindController.deleteKind
);

module.exports = router;
