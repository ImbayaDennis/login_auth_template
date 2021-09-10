const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');

exports.register = async (req, res, next) =>{
    const { username, email, password } = req.body;

    try {
        const user = await User.create({
            username, email, password
        });
        sendToken(user, 201, res);

    } catch (error) {
        next(error);
    }
}

exports.login = async (req, res, next) =>{
    const { email, password } = req.body;

    if(!email || ! password){
        return next(new ErrorResponse("Please provide an email and password", 400));
    }

    try {
        const user = await User.findOne({ email }).select("+password");

        if(!user){
            return next(new ErrorResponse("Invalid credentials", 401));
        }

        const isMatch = await user.matchPasswords(password);

        if(!isMatch){
            return next(new ErrorResponse("Invalid credentials", 401));
        }

        sendToken(user, 200, res);

    } catch (error) {
        next(error)
    }
}

exports.forgotpassword = async(req, res, next) =>{
    const{email} = req.body;

    try {
        const user = User.findOne({email});

        if(!user){
            return next(new ErrorResponse("Email could not be sent", 404));
        }

        const resetToken = user.getPasswordResetToken();

        await user.save();

        const resetUrl = `${process.env.RESET_URL}/${resetToken}`;
        const message =`
        <h1>Password reset</h1>
        <p>You have requested to have your password reset. click on the link bellow to reset your password</p>
        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
        `

        try {
            await sendEmail({
                to: user.email,
                subject: "Reset password",
                text: message
            });

            res.status(200).json({ success: true, data: "Email sent"});
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save();
            return next(new ErrorResponse("Email could not be sent", 500));
        }
    } catch (error) {
        return next(error);
    }
}

exports.resetpassword = (req, res, next) =>{
    res.send("Reset Password route");
}

const sendToken = (user, statusCode, res) =>{
    const token = user.getSignedToken();
    res.status(statusCode).json({ success: true, token})
}