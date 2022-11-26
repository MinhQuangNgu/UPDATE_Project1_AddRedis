const nodemailer = require("nodemailer");

function sendMail(to, subject, htmlForm) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "nmquang265@gmail.com",
            pass: "yjchljgjiossiucf",
        },
    });

    const mailOptions = {
        from: "nmquang265@gmail.com",
        to: to,
        subject: subject,
        html: htmlForm,
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
}

module.exports = sendMail;
