const mongoose = require("mongoose");
const schema = mongoose.Schema;

const accountModel = new schema(
    {
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        name: {
            type: String,
        },
        image: {
            type: String,
        },
        rule: {
            type: String,
            default: "user",
        },
        follows: {
            type: [
                {
                    type: mongoose.Types.ObjectId,
                    ref: "Products",
                },
            ],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Accounts", accountModel);
