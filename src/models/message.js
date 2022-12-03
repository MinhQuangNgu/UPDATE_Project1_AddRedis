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
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Messages", messageModel);
