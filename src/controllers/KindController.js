const Kind = require("../models/kinds");

class KindController {
    async getKind(req, res) {
        try {
            const kinds = await Kind.find();
            return res.status(200).json({ kinds });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async createKind(req, res) {
        try {
            const { name } = req.body;
            const kind = new Kind({ name });
            await kind.save();
            return res.status(200).json({ msg: `Tạo thành công ${name}` });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async deleteKind(req, res) {
        try {
            const { id } = req.params;
            const kind = await Kind.findById(id);
            if (!kind) {
                return res
                    .status(400)
                    .json({ msg: "Thể loại này không tồn tại." });
            }
            await Kind.findOneAndDelete(id);
            return res.status(200).json({ msg: `Xóa thành công ${kind.name}` });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}

module.exports = new KindController();
