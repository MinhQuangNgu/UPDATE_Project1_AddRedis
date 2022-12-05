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
