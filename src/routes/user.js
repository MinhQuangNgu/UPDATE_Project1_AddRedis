const router = require("express").Router();
const UserController = require("../controllers/UserController");
const MiddleWareController = require("../controllers/MiddleWareController");

router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.post("/active", UserController.activeMail);
router.post("/forgot", UserController.forgotPassword);
router.post("/facebook/login", UserController.facebookLogin);
router.post("/facebook/register", UserController.facebookRegister);
router.post("/google/register", UserController.googleRegister);
router.post("/google/login", UserController.googleLogin);
router.get("/token/refresh", UserController.getRefreshToken);
router.get(
    "/user/profile",
    MiddleWareController.verifyToken,
    UserController.getUserProfifle
);
router.post(
    "/user/profile/update",
    MiddleWareController.verifyToken,
    UserController.updateProfile
);

module.exports = router;
