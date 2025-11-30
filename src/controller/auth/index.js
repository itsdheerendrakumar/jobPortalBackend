import {User} from "../../model/userModel.js"
import {ErrorResponse} from "../../utils/errorResponse.js"
import {SuccessResponse} from "../../utils/successResponse.js"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

export const login = async (req, res, next) => {

    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(!user)
        return next(new ErrorResponse("Invalid credentials.", 400));
    const isMatched = await bcrypt.compare(password, user.password);
    if(!isMatched)
        return next(new ErrorResponse("Invalid credentials.", 400));
    if(user.status === "inactive") {
        return next(new ErrorResponse("Your account has been deactivated.", 400));
    }
    const token = await jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: "2 days"});
    return res.status(200).json(new SuccessResponse("Logged in successfully", {token}));

}

export const getProfile = async (req, res, next) => {

    const user = await User.aggregate([
        {
            $match: {_id: new mongoose.Types.ObjectId(req.userId)}
        },
        {
            $project: {
                userId: "$_id",
                name: 1,
                role: 1,
                resumePublicId: 1,
                status: 1,
                _id: 0
            }
        }
    ])
    
    if(!user?.length)
        return next(new ErrorResponse("User not found", 400));
    return res.status(200).json(new SuccessResponse("Profile found successfully", user?.[0]));
}