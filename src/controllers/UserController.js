const User = require("../models/account");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sendMail = require("./SendMail");
const Hogan = require("hogan.js");
const fs = require("fs");
const fetch = require("node-fetch");
const { OAuth2Client } = require("google-auth-library");
const Message = require("../models/message");

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
            const refreshToken = getRefreshToken(user);
            const accessToken = getAccessToken({ ...user, refreshToken });
            return res.status(200).json({
                msg: "Đăng nhập thành công.",
                accessToken,
                follows: user.follows,
                name: user.name,
                image: user.image,
                reads: user.reads,
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
            const accessToken = getAccessTokenActive(user);
            const subject = "Quên mật khẩu.";
            const template = fs.readFileSync("./src/views/email.hjs", "utf-8");
            const compileTemplate = Hogan.compile(template);
            sendMail(
                email,
                subject,
                compileTemplate.render({
                    urlSend: `https://localhost:3000/auth/forgot/${accessToken}`,
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

    async changePassword(req, res) {
        try {
            const user = req.user;
            const { password } = req.body;
            const oldUser = await User.findById(user?.id);
            if (!oldUser) {
                return res
                    .status(400)
                    .json({ msg: "Tài khoản không hề tồn tại." });
            }
            const hashedPassword = await bcrypt.hash(password, 12);
            await User.findByIdAndUpdate(user?.id, {
                password: hashedPassword,
            });
            return res.status(200).json({ msg: "Đổi mật khẩu thành công." });
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
                image: data.picture.data.url,
                name: data.name,
            });
            await user.save();
            const refreshToken = getRefreshToken(user);
            const accessToken = getAccessToken({ ...user, refreshToken });
            return res.status(200).json({
                msg: "Đăng ký thành công.",
                accessToken,
                follows: user.follows,
                name: user.name,
                image: user.image,
                reads: user.reads,
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

            const refreshToken = getRefreshToken(oldUser);
            const accessToken = getAccessToken({ ...oldUser, refreshToken });
            return res.status(200).json({
                msg: "Đăng nhập thành công.",
                accessToken,
                follows: oldUser.follows,
                name: oldUser.name,
                image: oldUser.image,
                reads: oldUser.reads,
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
                const refreshToken = getRefreshToken(user);
                const accessToken = getAccessToken({ ...user, refreshToken });
                return res.status(200).json({
                    msg: "Đăng ký thành công.",
                    accessToken,
                    follows: user.follows,
                    name: user.name,
                    image: user.image,
                    reads: user.reads,
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
                const refreshToken = getRefreshToken(oldUser);
                const accessToken = getAccessToken({
                    ...oldUser,
                    refreshToken,
                });
                return res.status(200).json({
                    msg: "Đăng nhập thành công.",
                    accessToken,
                    follows: oldUser.follows,
                    reads: oldUser.reads,
                    name: oldUser.name,
                    image: oldUser.image,
                });
            }
            verify().catch(console.error);
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async getRefreshToken(req, res) {
        try {
            const refreshToken = req.headers.token;

            const token = refreshToken.split(" ")[1];
            jwt.verify(token, process.env.REFRESHTOKEN, async (err, infor) => {
                if (err) {
                    return res.status(400).json({ msg: "Vui lòng đăng nhập." });
                }
                const user = await User.findById(infor.id);
                const refreshToken = getRefreshToken(user);
                const accessToken = getAccessToken({
                    ...user,
                    refreshToken,
                });
                return res.status(200).json({
                    accessToken,
                    follows: user.follows,
                    reads: user.reads,
                    name: user.name,
                    image: user.image,
                });
            });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async getUserProfifle(req, res) {
        try {
            const user = req.user;
            if (!user) {
                return res.status(400).json({ msg: "Vui lòng đăng nhập." });
            }
            const oldUser = await User.findById(user?.id)
                .select("-password -rule")
                .populate({
                    path: "reads.readId",
                })
                .populate({
                    path: "follows",
                });
            if (!oldUser) {
                return res
                    .status(400)
                    .json({ msg: "Tài khoản không hề tồn tại." });
            }
            return res.status(200).json({ user: oldUser });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async updateProfile(req, res) {
        try {
            const user = req.user;
            const { name, image } = req.body;
            if (!user) {
                return res.status(400).json({ msg: "Vui lòng đăng nhập." });
            }
            const oldUser = await User.findById(user?.id);
            if (!oldUser) {
                return res
                    .status(400)
                    .json({ msg: "Tài khoản không hề tồn tại." });
            }
            await User.findByIdAndUpdate(user?.id, {
                name: name,
                image: image,
            });
            return res.status(200).json({ msg: "Cập nhật thành công." });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async deleteAccount(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) {
                return res
                    .status(400)
                    .json({ msg: "Tài khoản này không còn tồn tại." });
            }
            const comments = await Message.find({ user: user?._id });
            comments.forEach(async (item) => {
                await Message.findByIdAndDelete(item?._id);
            });
            await User.findByIdAndDelete(id);
            return res
                .status(200)
                .json({ msg: `Đã xóa tài khoản ${user?.name}` });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}

function getAccessToken(user) {
    return jwt.sign(
        {
            id: user?._doc._id,
            rule: user?._doc.rule,
            refreshToken: user.refreshToken,
        },
        process.env.ACCESSTOKEN,
        {
            expiresIn: "1d",
        }
    );
}

function getRefreshToken(user) {
    return jwt.sign({ id: user?._id }, process.env.REFRESHTOKEN, {
        expiresIn: "30d",
    });
}

function getAccessTokenActive(user) {
    return jwt.sign({ user }, process.env.ACCESSTOKEN, {
        expiresIn: "5m",
    });
}

module.exports = new UserController();
