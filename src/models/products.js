const mongoose = require("mongoose");
const schema = mongoose.Schema;
const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);
const productModel = new schema(
    {
        title: {
            type: String,
        },
        seTitle: {
            type: String,
        },
        author: {
            type: String,
            default: "Đang cập nhật",
        },
        status: {
            type: String,
            default: "Đang cập nhật",
        },
        likes: {
            type: Number,
            default: 0,
        },
        follows: {
            type: Number,
            default: 0,
        },
        watchs: {
            type: Number,
            default: 0,
        },
        kinds: {
            type: [
                {
                    type: mongoose.Types.ObjectId,
                    ref: "Kinds",
                },
            ],
        },
        chapters: {
            type: [
                {
                    type: mongoose.Types.ObjectId,
                    ref: "Chapters",
                },
            ],
        },
        image: {
            type: String,
        },
        content: {
            type: String,
        },
        reviewers: {
            type: Number,
            default: 0,
        },
        stars: {
            type: Number,
            default: 0,
        },
        country: {
            type: mongoose.Types.ObjectId,
            ref: "Countries",
        },
        slug: {
            type: String,
            slug: "title",
        },
    },
    {
        timestamps: true,
    }
);

productModel.index({ title: "text", content: "text", seTitle: "text" });
const ProductSchema = mongoose.model("Products", productModel);
ProductSchema.createIndexes({
    title: "text",
    content: "text",
    seTitle: "text",
});
module.exports = ProductSchema;
