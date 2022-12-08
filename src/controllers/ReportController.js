const Report = require("../models/reports");

class ReportController {
    async getReports(req, res) {
        try {
            const page = req.query.page || 1;
            const limit = req.query.limit || 20;
            const skip = (page - 1) * limit;
            const reports = await Report.find()
                .populate({
                    path: "from",
                })
                .populate({
                    path: "to",
                })
                .populate({
                    path: "comment",
                })
                .skip(skip)
                .limit(limit);
            const count = await Report.count(
                await Report.find()
                    .populate({
                        path: "to",
                    })
                    .populate({
                        path: "comment",
                    })
                    .skip(null)
                    .limit(null)
            );
            return res.status(200).json({ reports, count });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async deleteReport(req, res) {
        try {
            const { id } = req.params;
            const report = await Report.findById(id);
            if (!report) {
                return res
                    .status(400)
                    .json({ msg: "Report này không tồn tại." });
            }
            await Report.findByIdAndDelete(id);
            return res.status(200).json({ msg: "Xóa thành công report." });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}

module.exports = new ReportController();
