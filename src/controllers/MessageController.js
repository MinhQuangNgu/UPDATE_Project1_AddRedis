const Message = require("../models/message");

class MessageController {
    async getMessage(req, res) {
        try {
            const { slug } = req.params;
            const page = req.query.page || 1;
            const limit = req.query.limit || 20;
            const skip = (page - 1) * limit;
            const mes = await Message.find({ movie: slug })
                .sort("-createdAt")
                .skip(skip)
                .limit(limit)
                .populate({
                    path: "user",
                })
                .populate({
                    path: "replies",
                    populate: {
                        path: "user",
                    },
                });
            return res.status(200).json({ messages: mes });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
    async deleteMessage(req, res) {
        try {
            const { id } = req.params;
            const comments = await Message.findById(id);
            if (comments) {
                if (req.user?._id?.toString() === comments.user?.toString()) {
                    comments?.replies?.forEach(async (item) => {
                        await Message.findByIdAndDelete(item);
                    });
                    await Message.findByIdAndDelete(id);
                    return res.status(200).json({ msg: "Xóa thành công." });
                } else {
                    return res
                        .status(400)
                        .json({ msg: "Xóa không thành công." });
                }
            } else {
                return res.status(400).json({ msg: "Xóa không thành công." });
            }
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }

    async deleteChild(req, res) {
        try {
            const { id, parentid } = req.params;
            const comments = await Message.findById(parentid);
            if (comments) {
                const comChild = await Message.findById(id);
                comments.replies = comments?.replies?.filter(
                    (item) => item?.toString() !== id?.toString()
                );
                await Message.findByIdAndUpdate(parentid, {
                    replies: comments.replies,
                });
                if (comChild) {
                    await Message.findByIdAndDelete(id);
                    res.status(200).json({ msg: "Xóa thành công." });
                } else {
                    return res
                        .status(400)
                        .json({ msg: "Bình luận này không còn tồn tại nữa." });
                }
            } else {
                return res.status(400).json({ msg: "Xóa không thành công." });
            }
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}

module.exports = new MessageController();
