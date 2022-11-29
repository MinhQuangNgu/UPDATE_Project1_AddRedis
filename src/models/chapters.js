const mongoose = require("mongoose");
const schema = mongoose.Schema;

const ChapterModel = new schema(
    {
        images: {
            type: [],
            default: [],
        },
        movie: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Chapters", ChapterModel);
