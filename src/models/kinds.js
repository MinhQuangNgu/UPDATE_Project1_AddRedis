const mongoose = require("mongoose");
const schema = mongoose.Schema;
const slug = require("mongoose-slug-generator");
mongoose.plugin(slug);
const KindModel = new schema(
    {
        name: {
            type: String,
        },
        slug: {
            type: String,
            slug: "name",
        },
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model("Kinds", KindModel);
