const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const router = require("./routes/index");

dotenv.config();

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
    socket.on("comment", (infor) => {
        console.log(infor);
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
