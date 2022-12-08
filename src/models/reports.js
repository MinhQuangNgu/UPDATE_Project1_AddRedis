const mongoose = require("mongoose");
const schema = mongoose.Schema;

const reportModel = new schema(
    {
        from: {
            type: mongoose.Types.ObjectId,
            ref: "Accounts",
        },
        to: {
            type: mongoose.Types.ObjectId,
            ref: "Accounts",
        },
        comment: {
            type: mongoose.Types.ObjectId,
            ref: "Messages",
        },
        number: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Reports", reportModel);
