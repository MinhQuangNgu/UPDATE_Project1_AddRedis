const mongoose = require("mongoose");
const schema = mongoose.Schema;

const reportModel = new schema(
    {
        from: {
            type: String,
            default: "",
        },
        to: {
            type: mongoose.Types.ObjectId,
            ref: "Accounts",
            default: "",
        },
        comment: {
            type: mongoose.Types.ObjectId,
            ref: "Messages",
            default: "",
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
