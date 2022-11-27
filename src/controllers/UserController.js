const User = require("../models/account");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sendMail = require("./SendMail");
const Hogan = require("hogan.js");
const fs = require("fs");
const fetch = require("node-fetch");
const { OAuth2Client } = require("google-auth-library");

class UserController {
    async register(req, res) {
        try {
            const { email, password, image, name } = req.body;
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
            const newPass = await bcrypt.hash(password, 12);
            const newUser = new User({
                email,
                password: newPass,
                image,
                name,
            });

            const accessToken = getAccessTokenActive(newUser);
            const subject = "Đăng ký tài khoản.";
            const template = fs.readFileSync("./src/views/email.hjs", "utf-8");
            const compileTemplate = Hogan.compile(template);
            sendMail(
                email,
                subject,
                compileTemplate.render({
                    urlSend: `https://localhost:3000/account/active/${accessToken}`,
                    content:
                        "Cảm ơn bạn đã đăng ký tài khoản bạn có 2 phút để nhấn vào nút bên dưới.",
                    kind: "Đăng ký",
                    title: "Bạn vui lòng nhấn vào nút bên dưới để hoàn thành quá trình đăng ký.",
                })
            );

            return res.status(200).json({
                msg: "Vui lòng kiểm tra email của bạn để hoàn tất quá trình.",
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
            return res.status(200).json({
                msg: "Đăng nhập thành công.",
                accessToken,
                rule: user.rule,
                follows: user.follows,
            });
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
                    name: infor.user.name,
                });
                await newUser.save();
                res.status(200).json({ msg: "Đăng ký thành công." });
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });
            const accessToken = getAccessToken(user);
            const subject = "Quên mật khẩu.";
            const template = fs.readFileSync("./src/views/email.hjs", "utf-8");
            const compileTemplate = Hogan.compile(template);
            sendMail(
                email,
                subject,
                compileTemplate.render({
                    urlSend: `https://localhost:3000/forgot/${accessToken}`,
                    content: "Quên mật khẩu.",
                    kind: "Lấy lại mật khẩu",
                    title: "Bạn vui lòng nhấn vào nút bên dưới để hoàn thành quá trình lấy lại mật khẩu.",
                })
            );
            return res.status(200).json({
                msg: "Vui lòng kiểm tra email của bạn.",
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async facebookRegister(req, res) {
        try {
            const { token, userId } = req.body;
            const product = await fetch(
                `https://graph.facebook.com/${userId}?fields=id,name,email,picture&access_token=${token}`
            );
            const data = await product.json();

            const oldUser = await User.findOne({ email: data.email });
            if (oldUser) {
                return res
                    .status(400)
                    .json({ msg: "Xin lỗi tài khoản này đã tồn tại." });
            }
            const hashedPassword = await bcrypt.hash(
                data.id + process.env.ACCESSTOKEN,
                12
            );
            const user = new User({
                email: data.email,
                password: hashedPassword,
                image: data.picture.url,
                rule: "user",
                name: data.name,
            });
            await user.save();
            const accessToken = getAccessToken(user);
            return res.status(200).json({
                msg: "Đăng ký thành công.",
                accessToken,
                rule: user.rule,
                follows: user.follows,
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async facebookLogin(req, res) {
        try {
            const { token, userId } = req.body;
            const product = await fetch(
                `https://graph.facebook.com/${userId}?fields=id,name,email,picture&access_token=${token}`
            );
            const data = await product.json();

            const oldUser = await User.findOne({ email: data.email });

            if (!oldUser) {
                return res
                    .status(400)
                    .json({ msg: "Xin lỗi tài khoản này không tồn tại." });
            }

            const validDation = await bcrypt.compare(
                data.id + process.env.ACCESSTOKEN,
                oldUser.password
            );
            if (!validDation) {
                return res.status(400).json({
                    msg: "Tài khoản này đã được đăng ký bằng cách khác.",
                });
            }

            const accessToken = getAccessToken(oldUser);
            return res.status(200).json({
                msg: "Đăng nhập thành công.",
                accessToken,
                rule: oldUser.rule,
                follows: oldUser.follows,
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async googleRegister(req, res) {
        try {
            const { clientId, token } = req.body;
            const client = new OAuth2Client(clientId);
            async function verify() {
                const ticket = await client.verifyIdToken({
                    idToken: token,
                    audience: clientId,
                });
                const payload = ticket.getPayload();
                if (!payload.email_verified) {
                    return res.status(400).json({
                        msg: "Xin lỗi nhưng có lỗi với tài khoản này.",
                    });
                }

                const oldUser = await User.findOne({ email: payload.email });
                if (oldUser) {
                    return res
                        .status(400)
                        .json({ msg: "Xin lỗi tài khoản này đã tồn tại." });
                }

                const hashedPassword = await bcrypt.hash(
                    payload.sub + process.env.ACCESSTOKEN,
                    12
                );
                const user = new User({
                    email: payload.email,
                    password: hashedPassword,
                    image: payload.picture,
                    name: payload.name,
                });
                await user.save();
                const accessToken = getAccessToken(user);
                return res.status(200).json({
                    msg: "Đăng ký thành công.",
                    accessToken,
                    rule: user.rule,
                    follows: user.follows,
                });
            }
            verify().catch(console.error);
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
    async googleLogin(req, res) {
        try {
            const { clientId, token } = req.body;
            const client = new OAuth2Client(clientId);
            async function verify() {
                const ticket = await client.verifyIdToken({
                    idToken: token,
                    audience: clientId,
                });
                const payload = ticket.getPayload();
                if (!payload.email_verified) {
                    return res.status(400).json({
                        msg: "Xin lỗi nhưng có lỗi với tài khoản này.",
                    });
                }

                const oldUser = await User.findOne({ email: payload.email });
                if (!oldUser) {
                    return res
                        .status(400)
                        .json({ msg: "Xin lỗi tài khoản này không tồn tại." });
                }
                const validDation = await bcrypt.compare(
                    payload.sub + process.env.ACCESSTOKEN,
                    oldUser.password
                );
                if (!validDation) {
                    return res.status(400).json({
                        msg: "Tài khoản này đã được đăng ký bằng cách khác.",
                    });
                }
                const accessToken = getAccessToken(oldUser);
                return res.status(200).json({
                    msg: "Đăng nhập thành công.",
                    accessToken,
                    rule: oldUser.rule,
                    follows: oldUser.follows,
                });
            }
            verify().catch(console.error);
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}

function getAccessToken(user) {
    return jwt.sign({ user }, process.env.ACCESSTOKEN, {
        expiresIn: "10m",
    });
}
function getAccessTokenActive(user) {
    return jwt.sign({ user }, process.env.ACCESSTOKEN, {
        expiresIn: "2m",
    });
}

module.exports = new UserController();
