const Chapter = require("../models/chapters");
const Product = require("../models/products");

class ChapterController {
    async createChapter(req, res) {
        try {
            const { slug } = req.params;
            const { images } = req.body;
            const product = await Product.findOne({ slug });
            if (!product) {
                return res.status(400).json({ msg: "Không có truyện này." });
            }

            const chapter = new Chapter({
                movie: slug,
                images,
            });

            product.chapters.push(chapter._id);

            await chapter.save();
            await Product.findOneAndUpdate(
                { slug },
                {
                    chapters: product.chapters,
                }
            );
            return res
                .status(200)
                .json({ msg: `Tạo thành công chapter cho ${slug}` });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async updateChapter(req, res) {
        try {
            const { id } = req.params;
            const { images } = req.body;
            const chapter = await Chapter.findById(id);
            if (!chapter) {
                return res.status(400).json({ msg: "Không có chương này." });
            }
            await Chapter.findByIdAndUpdate(id, {
                images,
            });
            return res.status(200).json({ msg: `Cập nhật thành công.` });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}

module.exports = new ChapterController();
