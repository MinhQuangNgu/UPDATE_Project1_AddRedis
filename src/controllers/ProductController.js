const Product = require("../models/products");
const Kind = require("../models/kinds");
const Country = require("../models/countries");
const redisClient = require("../redis");

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
		const excludesFields = [
			"page",
			"sort",
			"search",
			"limit",
			"kind",
			"country",
		];

		excludesFields.forEach((el) => {
			delete obj[el];
		});

		var objStr = JSON.stringify(obj);
		objStr = objStr.replace(/\b(gte|gt|lte|lt|regex)\b/g, (el) => "$" + el);

		this.query = this.query.find(JSON.parse(objStr));
		return this;
	}

	searching() {
		const search = this.queryString.searching;
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
			const kind = req.query.kind || "";
			const country = req.query.country || "";
			let kindContain = "";
			let countryContain = "";
			if (kind) {
				kindContain = await Kind.findOne({ slug: kind });
			}
			if (country) {
				countryContain = await Country.findOne({ slug: country });
			}
			const page = req.query.page || 1;
			const limit = req.query.limit || 12;
			const search = req.query.searching || "";
			const sort = req.query.sort || "-createdAt";
			const data = await redisClient.HGET(
				"allproduct",
				`${kind + country + page + limit + sort + search}`
			);

			if (data) {
				const da = JSON.parse(data);
				return res.status(200).json({ Products: da.Products, count: da.count });
			}

			if (!kind && !country) {
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
				redisClient.HSET(
					"allproduct",
					`${kind + country + page + limit + sort + search}`,
					JSON.stringify({ Products: products, count })
				);
				return res.status(200).json({ Products: products, count });
			} else if (!kind && country) {
				const apiRequest = new ApiRequest(
					Product.find({
						country: countryContain?._id,
					})
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
				redisClient.HSET(
					"allproduct",
					`${kind + country + page + limit + sort + search}`,
					JSON.stringify({ Products: products, count })
				);
				return res.status(200).json({ Products: products, count });
			} else if (kind && !country) {
				const apiRequest = new ApiRequest(
					Product.find({
						kinds: kindContain?._id,
					})
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
				redisClient.HSET(
					"allproduct",
					`${kind + country + page + limit + sort + search}`,
					JSON.stringify({ Products: products, count })
				);
				return res.status(200).json({ Products: products, count });
			} else {
				const apiRequest = new ApiRequest(
					Product.find({
						kinds: kindContain?._id,
						country: countryContain?._id,
					})
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
				redisClient.HSET(
					"allproduct",
					`${kind + country + page + limit + sort + search}`,
					JSON.stringify({ Products: products, count })
				);
				res.status(200).json({ Products: products, count });
			}
		} catch (err) {
			console.log(err);
			return res.status(500).json({ msg: err.message });
		}
	}

	async createProduct(req, res) {
		try {
			const { image, title, seTitle, author, status, kinds, content, country } =
				req.body;
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
			redisClient.DEL("allproduct");
			return res.status(200).json({ msg: `Tạo thành công ${title}` });
		} catch (err) {
			return res.status(500).json({ msg: err.message });
		}
	}

	async updateProduct(req, res) {
		try {
			const { slug } = req.params;

			const { image, title, seTitle, author, status, kinds, content, country } =
				req.body;

			await Product.findOneAndUpdate(
				{ slug },
				{
					image,
					title,
					seTitle,
					author,
					status,
					kinds,
					content,
					country,
				}
			);
			redisClient.DEL("allproduct");
			redisClient.DEL(slug);
			redisClient.set(
				slug,
				JSON.stringify({
					product: {
						image,
						title,
						seTitle,
						author,
						status,
						kinds,
						content,
						country,
					},
				})
			);
			return res.status(200).json({ msg: `Cập nhật ${title}` });
		} catch (err) {
			return res.status(500).json({ msg: err.message });
		}
	}

	async deleteProduct(req, res) {
		try {
			const { slug } = req.params;
			const product = await Product.findOne({ slug });
			if (!product) {
				return res.status(400).json({ msg: "Truyện này không tồn tại." });
			}

			await Product.findOneAndDelete({ slug });
			redisClient.DEL("allproduct");
			redisClient.DEL(slug);

			return res.status(200).json({ msg: `Cập nhật ${product.title}` });
		} catch (err) {
			return res.status(500).json({ msg: err.message });
		}
	}

	async getOne(req, res) {
		try {
			const { slug } = req.params;
			const data = await redisClient.get(slug);
			if (data) {
				const da = JSON.parse(data);
				return res.status(200).json({ product: da.product });
			}
			const product = await Product.findOne({ slug })
				.populate({
					path: "country",
				})
				.populate({
					path: "kinds",
				})
				.populate({
					path: "chapters",
				});
			if (!product) {
				return res.status(400).json({ msg: "Truyện này không tồn tại." });
			}
			redisClient.set(
				slug,
				JSON.stringify({
					product: product,
				})
			);
			return res.status(200).json({ product });
		} catch (err) {
			return res.status(500).json({ msg: err.message });
		}
	}
}

module.exports = new ProductController();
