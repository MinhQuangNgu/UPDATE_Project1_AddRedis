const mongoose = require("mongoose");
const schema = mongoose.Schema;

const messageModel = new schema(
    {
        user: {
            type: mongoose.Types.ObjectId,
            ref: "Accounts",
        },
        content: {
            type: String,
        },
        movie: {
            type: String,
        },
        chapter: {
            type: String,
        },
        likes: {
            type: Number,
            default: 0,
        },
        replies: {
            type: [
                {
                    type: mongoose.Types.ObjectId,
                    ref: "Messages",
                },
            ],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Messages", messageModel);
