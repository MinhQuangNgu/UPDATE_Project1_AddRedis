const Country = require("../models/countries");
const redisClient = require("../redis");

class CountryController {
	async getcountry(req, res) {
		try {
			const data = await redisClient.get("country");
			if (data) {
				return res.status(200).json({ countries: JSON.parse(data).countries });
			}
			const countries = await Country.find();
			redisClient.set(
				"country",
				JSON.stringify({
					countries,
				})
			);
			return res.status(200).json({ countries });
		} catch (err) {
			return res.status(500).json({ msg: err.message });
		}
	}

	async createcountry(req, res) {
		try {
			const { name } = req.body;
			const country = new Country({ name });
			await country.save();
			redisClient.DEL("country");
			return res.status(200).json({ msg: `Tạo thành công ${name}` });
		} catch (err) {
			return res.status(500).json({ msg: err.message });
		}
	}

	async deletecountry(req, res) {
		try {
			const { id } = req.params;
			const country = await Country.findById(id);
			if (!country) {
				return res.status(400).json({ msg: "Thể loại này không tồn tại." });
			}
			await Country.findOneAndDelete(id);
			redisClient.DEL("country");
			return res.status(200).json({ msg: `Xóa thành công ${country.name}` });
		} catch (err) {
			return res.status(500).json({ msg: err.message });
		}
	}
}

module.exports = new CountryController();
