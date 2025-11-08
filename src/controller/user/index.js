import bcrypt from "bcrypt";
import { ErrorResponse } from "../../utils/errorResponse.js";
import { User } from "../../model/userModel.js";
import { SuccessResponse } from "../../utils/successResponse.js";
import { userRoles, userStatus } from "../../constants/enums.js";
import { Job } from "../../model/jobModel.js";

export const createUser = (role) => {
    return async (req, res, next) => {

        const {password, ...rest} = req.validatedData;
        const {deletePermission} = req.body;
        const currentUser = await User.findOne({email: req.validatedData.email});
        if(!!currentUser)
            return next(new ErrorResponse("User with this email already exists", 400));
        const hashedPassword = await bcrypt.hash(password,parseInt(process.env.SALT));
        const user = await User.insertOne({
            ...rest, 
            role, 
            password: hashedPassword, 
            ...(typeof deletePermission === "boolean" && {deletePermission})
        });
        return res.status(201).json(new SuccessResponse("Account created successfully", {}))
    }
}

export const getSuperAdminMetrics = async (req, res, next) => {

    const metrics = await User.aggregate([
        {
            $group: {
                _id: "$role",
                totalCount: {$sum: 1}
            }
        },
        {
            $group: {
                _id: null,
                mergedData: {$push: {k:"$_id", v:"$totalCount"}}
            }
        },
        {
            $project: {
                _id: 0,
                metrics: {$arrayToObject: "$mergedData"}
            }
        }
    ]);
    const {superAdmin, ...rest} = metrics?.[0]?.metrics;
    return res.status(200).json(new SuccessResponse("Metrics found successfully", rest));

}

export const getUserListing = (role) => {
    return async (req, res, next) => {
        const users = await User.find({role}).select({password: 0, education: 0});
        return res.status(200).json(new SuccessResponse(
            `${role === "admin" ? "Admin" : (role === "reviewer" ? "Reviewer" : "User")} listing found successfully"`, users
        ))
    }
}

export const updateAdminStatus = async (req, res, next) => {
    const {status, adminId} = req.body;
    if(!userStatus.includes(status))
        return next(new ErrorResponse("Invalid status value", 400));
    const admin = await User.findById(adminId);
    if(!admin || admin?.role !== "admin")
        return next(new ErrorResponse("Invalid admin id", 400))
    admin.status = status;
    await admin.save();
    res.status(200).json(new SuccessResponse("Admin status updated successfully", {}))
}

export const deleteAdmin = async (req, res, next) => {
    console.log("delete admin called")
    const {adminId} = req.params;
    const user = await User.findByIdAndDelete(adminId);
    if(!user || user.role !== "admin")
        next(new ErrorResponse("Invalid admin id", 400));
    await Job.updateMany({createdBy: adminId}, {createdBy: undefined});
    res.status(200).json(new SuccessResponse("Account deleted successfully", {}))
}

export const promoteReviewer = async (req, res, next) => {
    const {userId} = req.body;
    if(!userId)
        return next(new ErrorResponse("Invalid user id.", 400))
    const user = await User.findById(userId);
    if(!user || user.role !== "reviewer")
        return next(new ErrorResponse("User does not found", 400));
    user.role = "admin";
    await user.save();
    return res.status(200).json(new SuccessResponse("User promoted successfully.", {}));
}

export const getUserSelectListing = async (req, res, next) => {
    const {role} = req.query;
    if(!userRoles.includes(role))
        return next(new ErrorResponse("Provide valid role", 400))
    const users = await User.aggregate([
        {
            $match: {role, status: "active"},
        },
        {
            $project: {
                label: "$name",
                value: "$_id",
                _id: 0
            }
        }
    ]);
    return res.status(200).json((new SuccessResponse("User listing found successfully", users)))
}