const Product = require("../models/products");

class ApiRequest {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    paginating() {
        const page = this.queryString.page || 1;
        const limit = this.queryString.limit || 12;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }

    sorting() {
        const sort = this.queryString.sort || "-createdAt";
        this.query = this.query.sort(sort);
        return this;
    }

    filtering() {
        const obj = { ...this.queryString };
        const excludesFields = ["page", "sort", "search", "limit"];

        excludesFields.forEach((el) => {
            delete obj[el];
        });

        var objStr = JSON.stringify(obj);
        objStr = objStr.replace(/\b(gte|gt|lte|lt|regex)\b/g, (el) => "$" + el);

        this.query = this.query.find(JSON.parse(objStr));
        return this;
    }

    searching() {
        const search = this.query.search;
        if (search) {
            this.query = this.query.find({
                $text: {
                    $search: search,
                },
            });
        } else {
            this.query = this.query.find();
        }
        return this;
    }
}
class ProductController {
    async getProduct(req, res) {
        try {
            const apiRequest = new ApiRequest(
                Product.find()
                    .populate({
                        path: "chapters",
                    })
                    .populate({
                        path: "country",
                    })
                    .populate({
                        path: "kinds",
                    }),
                req.query
            )
                .paginating()
                .filtering()
                .searching()
                .sorting();

            const products = await apiRequest.query;
            const count = await Product.count(
                apiRequest.query.limit(null).skip(null)
            );
            res.status(200).json({ Products: products, count });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async createProduct(req, res) {
        try {
            const {
                image,
                title,
                seTitle,
                author,
                status,
                kinds,
                content,
                country,
            } = req.body;

            const product = new Product({
                image,
                title,
                seTitle,
                author,
                status,
                kinds,
                content,
                country,
            });
            await product.save();
            return res.status(200).json({ msg: `Tạo thành công ${title}` });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async updateProduct(req, res) {
        try {
            const { id } = req.params;

            const {
                image,
                title,
                seTitle,
                author,
                status,
                kinds,
                content,
                country,
            } = req.body;

            await Product.findByIdAndUpdate(id, {
                image,
                title,
                seTitle,
                author,
                status,
                kinds,
                content,
                country,
            });
            return res.status(200).json({ msg: `Cập nhật ${title}` });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            const product = await Product.findById(id);
            if (!product) {
                return res
                    .status(400)
                    .json({ msg: "Truyện này không tồn tại." });
            }

            await Product.findByIdAndDelete(id);

            return res.status(200).json({ msg: `Cập nhật ${product.title}` });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async getOne(req, res) {
        try {
            const { slug } = req.params;
            const product = await Product.findOne({ slug });
            if (!product) {
                return res
                    .status(400)
                    .json({ msg: "Truyện này không tồn tại." });
            }

            return res.status(200).json({ product });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}

module.exports = new ProductController();
