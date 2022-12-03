const User = require("../models/account");
const jwt = require("jsonwebtoken");

class MiddleWareController {
    async verifyAdmin(req, res, next) {
        try {
            const accessToken = req.headers.token;

            if (!accessToken) {
                return res.status(400).json({ msg: "Vui lòng đăng nhập 1." });
            }
            const token = accessToken.split(" ")[1];
            if (!token) {
                return res.status(400).json({ msg: "Vui lòng đăng nhập 2." });
            }
            jwt.verify(token, process.env.ACCESSTOKEN, async (err, infor) => {
                if (err) {
                    return res
                        .status(400)
                        .json({ msg: "Vui lòng đăng nhập 3." });
                }
                const user = await User.findById(infor.id);
                if (!user) {
                    return res
                        .status(400)
                        .json({ msg: "Vui lòng đăng nhập 4." });
                }
                if (user.rule !== "admin") {
                    return res
                        .status(400)
                        .json({ msg: "Vui lòng đăng nhập 5." });
                }
                next();
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
    async verifyToken(req, res, next) {
        try {
            const accessToken = req.headers.token;

            if (!accessToken) {
                return res.status(400).json({ msg: "Vui lòng đăng nhập 1." });
            }
            const token = accessToken.split(" ")[1];
            if (!token) {
                return res.status(400).json({ msg: "Vui lòng đăng nhập 2." });
            }
            jwt.verify(token, process.env.ACCESSTOKEN, async (err, infor) => {
                if (err) {
                    return res
                        .status(400)
                        .json({ msg: "Vui lòng đăng nhập 3." });
                }
                const user = await User.findById(infor.id);
                if (!user) {
                    return res
                        .status(400)
                        .json({ msg: "Vui lòng đăng nhập 4." });
                }
                req.user = user;
                next();
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}

module.exports = new MiddleWareController();
