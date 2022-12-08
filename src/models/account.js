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
            default:
                "https://res.cloudinary.com/sttruyen/image/upload/v1669539375/Sttruyenxyz/l60Hf_iscgwm.png",
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
        reads: {
            type: [
                {
                    readId: {
                        type: mongoose.Types.ObjectId,
                        ref: "Products",
                    },
                    chapters: [],
                },
            ],
            default: [],
        },
        likes: {
            type: [
                {
                    type: mongoose.Types.ObjectId,
                    ref: "Products",
                },
            ],
            default: [],
        },
        block: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Accounts", accountModel);
