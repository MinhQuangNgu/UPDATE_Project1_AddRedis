const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const router = require("./routes/index");
const jwt = require("jsonwebtoken");
dotenv.config();

const User = require("./models/account");

const Comment = require("./models/message");
const Product = require("./models/products");

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: "https://localhost:3000",
        credentials: true,
    })
);
app.use(cookieParser());

const http = require("http").createServer(app);

const io = require("socket.io")(http, {
    cors: "*",
});

io.on("connection", (socket) => {
    socket.on("join", (infor) => {
        socket.join(infor.slug);
    });
    socket.on("reply", (infor) => {
        const token = infor.token;
        jwt.verify(token, process.env.ACCESSTOKEN, async (err, user) => {
            if (err) {
                return;
            }

            const oldUser = await User.findById(user.id);

            const baseComment = await Comment.findById(infor?.id);

            const comment = new Comment({
                user: oldUser._id,
                content: infor.content,
                movie: "",
                chapter: "",
            });

            await comment.save();
            baseComment.replies.push(comment._id);
            await Comment.findByIdAndUpdate(infor?.id, {
                replies: baseComment.replies,
            });

            const com = { ...comment._doc };
            delete com["user"];
            io.to(infor.slug).emit("backRep", {
                user: {
                    ...oldUser._doc,
                },
                ...com,
                commentid: baseComment._id,
            });
        });
    });
    socket.on("comment", (infor) => {
        const token = infor.token;
        jwt.verify(token, process.env.ACCESSTOKEN, async (err, user) => {
            if (err) {
                return;
            }
            const oldUser = await User.findById(user.id);
            const comment = new Comment({
                user: oldUser._id,
                content: infor.content,
                movie: infor.slug,
                chapter: infor.chapter,
            });

            await comment.save();

            const com = { ...comment._doc };
            delete com["user"];
            io.in(infor.slug).emit("backMan", {
                user: {
                    ...oldUser._doc,
                },
                ...com,
            });
        });
    });
    socket.on("Like", async (infor) => {
        const comment = await Comment.findById(infor?.id);
        if (!comment) {
        } else {
            if (infor?.type) {
                await Comment.findByIdAndUpdate(infor?.id, {
                    likes: comment?.likes + 1,
                });
            } else {
                await Comment.findByIdAndUpdate(infor?.id, {
                    likes: comment?.likes - 1,
                });
            }
        }
    });

    socket.on("rating", async (infor) => {
        const product = await Product.findById(infor?.id);
        if (product) {
            if (infor?.type) {
                await Product.findByIdAndUpdate(infor?.id, {
                    stars: product?.stars + infor?.star,
                });
            } else {
                await Product.findByIdAndUpdate(infor?.id, {
                    stars: product?.stars + infor?.star,
                    reviewers: product?.reviewers + 1,
                });
            }
        }
    });
    socket.on("watching", async (infor) => {
        const product = await Product.findById(infor?.id);
        if (product) {
            await Product.findByIdAndUpdate(infor?.id, {
                watchs: product?.watchs + 1,
            });
        }
    });
    socket.on("UpdateMessage", async (infor) => {
        const token = infor.token;
        jwt.verify(token, process.env.ACCESSTOKEN, async (err, user) => {
            if (err) {
                return;
            }
            const comment = await Comment.findById(infor?.id);
            if (comment) {
                await Comment.findByIdAndUpdate(infor?.id, {
                    content: infor?.content,
                });
                if (user?.id?.toString() === comment?.user?.toString()) {
                    io.to(infor?.slug).emit("updateComment", {
                        content: infor?.content,
                        id: infor?.id,
                    });
                }
            }
        });
    });
    socket.on("deleteMessage", (infor) => {
        const token = infor.token;
        jwt.verify(token, process.env.ACCESSTOKEN, async (err, user) => {
            if (err) {
                return;
            }
            const comment = await Comment.findById(infor?.id);
            if (comment) {
                if (user?.id?.toString() === comment?.user?.toString()) {
                    comment?.replies?.forEach(async (item) => {
                        await Comment.findByIdAndDelete(item);
                    });
                    await Comment.findByIdAndDelete(infor?.id);
                    io.to(infor?.slug).emit("deleteMessageReply", {
                        id: infor?.id,
                    });
                }
            }
        });
    });
    socket.on("UpdateReplyMessage", async (infor) => {
        const token = infor.token;
        jwt.verify(token, process.env.ACCESSTOKEN, async (err, user) => {
            if (err) {
                return;
            }
            const comment = await Comment.findById(infor?.id);
            if (comment) {
                if (user?.id?.toString() === comment?.user?.toString()) {
                    await Comment.findByIdAndUpdate(infor?.id, {
                        content: infor?.content,
                    });
                    io.to(infor?.slug).emit("updateCommentReply", {
                        content: infor?.content,
                        id: infor?.id,
                    });
                }
            }
        });
    });
    socket.on("deleteReplyComment", async (infor) => {
        const token = infor.token;
        jwt.verify(token, process.env.ACCESSTOKEN, async (err, user) => {
            if (err) {
                console.log(err);
                return;
            }
            const comment = await Comment.findById(infor?.idparent);
            const comChild = await Comment.findById(infor?.id);
            if (comment && comChild) {
                if (user?.id?.toString() === comChild?.user?.toString()) {
                    comment.replies = comment?.replies?.filter(
                        (item) => item?.toString() !== infor?.id?.toString()
                    );
                    await Comment.findByIdAndUpdate(infor?.idparent, {
                        replies: comment.replies,
                    });
                    await Comment.findByIdAndDelete(infor?.id);
                    io.to(infor?.slug).emit("deleteReplyBack", {
                        id: infor?.id,
                        parentid: infor?.idparent,
                    });
                }
            }
        });
    });
    socket.on("follows", async (infor) => {
        const token = infor.token;
        jwt.verify(token, process.env.ACCESSTOKEN, async (err, user) => {
            if (err) {
                console.log(err);
                return;
            }
            const oldUser = await User.findById(user?.id);
            if (oldUser) {
                const product = await Product.findById(infor?.id);
                if (product) {
                    const check = oldUser.follows.some(
                        (item) => item?.toString() === product?._id?.toString()
                    );
                    let num = false;
                    if (!check) {
                        oldUser.follows.push(product?._id);
                        await Product.findByIdAndUpdate(product?._id, {
                            follows: product.follows + 1,
                        });
                        num = true;
                    } else {
                        oldUser.follows = oldUser.follows.filter(
                            (item) =>
                                item?.toString() !== product?._id?.toString()
                        );
                        await Product.findByIdAndUpdate(product?._id, {
                            follows: product.follows - 1,
                        });
                    }
                    await User.findByIdAndUpdate(user?.id, {
                        follows: oldUser.follows,
                    });
                    socket.emit("BackFollow", {
                        follows: oldUser.follows,
                        num: num,
                    });
                }
            }
        });
    });

    socket.on("reading", async (infor) => {
        const token = infor.token;
        jwt.verify(token, process.env.ACCESSTOKEN, async (err, user) => {
            if (err) {
                console.log(err);
                return;
            }
            const oldUser = await User.findById(user?.id);
            if (oldUser) {
                const product = await Product.findById(infor?.id);
                if (product) {
                    const check = oldUser.reads.some(
                        (item) =>
                            item?.readId?.toString() ===
                            product?._id?.toString()
                    );
                    if (check) {
                        oldUser.reads = oldUser.reads.map((item) => {
                            if (
                                item?.readId?.toString() ===
                                product?._id?.toString()
                            ) {
                                const check2 = item?.chapters.some(
                                    (item) => item === infor.chapter
                                );
                                if (!check2) {
                                    item.chapters.push(infor.chapter);
                                }
                            }
                            return item;
                        });
                    } else {
                        oldUser.reads.push({
                            readId: product?._id,
                            chapters: [infor.chapter],
                        });
                    }
                    await User.findByIdAndUpdate(oldUser._id, {
                        reads: oldUser.reads,
                    });
                    socket.emit("backReading", {
                        reads: oldUser.reads,
                    });
                }
            }
        });
    });
});

mongoose
    .connect(process.env.DATABASE_URL, {
        useNewUrlParser: true,
    })
    .then((res) => {
        console.log("connected to database");
    })
    .catch((err) => {
        console.log("error databsae:" + err);
    });

const PORT = process.env.PORT || 5000;

router(app);

http.listen(PORT, () => {
    console.log("Your website are runnning.");
});
