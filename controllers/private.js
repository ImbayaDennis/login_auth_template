exports.getPrivateRoute = (req, res, next) =>{
    res.status(200).json({ success: true, data: "You have successfully gained access to this private route" });
}