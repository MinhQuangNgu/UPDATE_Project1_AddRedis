const Message = require("../models/message");

class MessageController {
    async getMessage(req, res) {
        try {
            const { slug } = req.params;
            const { page, limit } = req.query;
            const skip = (page - 1) * limit;
            const mes = await Message.find({ movie: slug })
                .skip(skip)
                .limit(limit);

            return res.status(200).json({ messages: mes });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    }
}

module.exports = new MessageController();
