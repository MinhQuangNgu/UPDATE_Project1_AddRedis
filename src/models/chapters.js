const mongoose = require("mongoose");
const schema = mongoose.Schema;

const ChapterModel = new schema(
    {
        images: {
            type: [],
            default: [],
        },
        movie: {
            type: mongoose.Types.ObjectId,
            ref: "Products",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Chapters", ChapterModel);
