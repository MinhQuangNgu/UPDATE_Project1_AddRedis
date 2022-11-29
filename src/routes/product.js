const ProductController = require("../controllers/ProductController");
const router = require("express").Router();
const MiddleWareController = require("../controllers/MiddleWareController");

router.post(
    "/update/:id",
    MiddleWareController.verifyAdmin,
    ProductController.updateProduct
);
router.delete(
    "/delete/:id",
    MiddleWareController.verifyAdmin,
    ProductController.deleteProduct
);
router.post(
    "/create",
    MiddleWareController.verifyAdmin,
    ProductController.createProduct
);
router.get("/:slug", ProductController.getOne);
router.get("/", ProductController.getProduct);

module.exports = router;
