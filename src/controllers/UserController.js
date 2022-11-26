const User = require("../models/account");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sendMail = require("./SendMail");
class UserController {
    async register(req, res) {
        try {
            const { email, password, image } = req.body;
            const user = await User.findOne({ email });
            if (user) {
                return res
                    .status(400)
                    .json({ msg: "Email này đã được sử dụng." });
            }
            if (password.length < 8) {
                return res
                    .status(400)
                    .json({ msg: "Mật khẩu cần lớn hơn 8 kí tự." });
            }
            const subject = "Đăng ký tài khoản.";
            const htmlForm = "";
            sendMail(email, subject, htmlForm);
            const newPass = await bcrypt.hash(password, 12);
            const newUser = new User({
                email,
                password: newPass,
                image,
            });

            const accessToken = getAccessToken(newUser);

            return res.status(200).json({
                msg: "Vui lòng kiểm tra email của bạn để hoàn tất quá trình.",
                accessToken,
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email });
            if (!user) {
                return res
                    .status(400)
                    .json({ msg: "Tài khoản hoặc mật khẩu không chính xác." });
            }
            const checkPassword = await bcrypt.compare(password, user.password);
            if (!checkPassword) {
                return res
                    .status(400)
                    .json({ msg: "Tài khoản hoặc mật khẩu không chính xác." });
            }
            const accessToken = getAccessToken(user);
            return res
                .status(200)
                .json({ msg: "Đăng nhập thành công.", accessToken });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async activeMail(req, res) {
        try {
            const { token } = req.body;
            jwt.verify(token, process.env.ACCESSTOKEN, async (err, infor) => {
                if (err) {
                    return res
                        .status(400)
                        .json({ msg: "Token này đã hết hạn." });
                }
                const newUser = new User({
                    email: infor.user.email,
                    password: infor.user.password,
                    image: infor.user.image,
                });
                await newUser.save();
                res.status(200).json({ msg: "Đăng ký thành công." });
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}

function getAccessToken(user) {
    return jwt.sign({ user }, process.env.ACCESSTOKEN, {
        expiresIn: "5m",
    });
}

module.exports = new UserController();
