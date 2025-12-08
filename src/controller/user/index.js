import bcrypt from "bcrypt";
import { ErrorResponse } from "../../utils/errorResponse.js";
import { User } from "../../model/userModel.js";
import { SuccessResponse } from "../../utils/successResponse.js";
import { userRoles, userStatus } from "../../constants/enums.js";
import { Job } from "../../model/jobModel.js";
import { cloudinary } from "../../utils/cloudnarySetup.js";
import { genCloudinaryPublicUrl } from "../../utils/generateCloudinaryPublicUrl.js";
import { AppliedJob } from "../../model/appliedJob.js";

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

    const p1 = User.aggregate([
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
    const p2 = AppliedJob.find({adminStatus: "pending"}).countDocuments();
    const [metrics, pendingApplications] = await Promise.all([p1, p2]);
    const {superAdmin, ...rest} = metrics?.[0]?.metrics;
    return res.status(200).json(new SuccessResponse("Metrics found successfully", {...rest, pendingApplications}));

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

export const getTypeUserById = async (req, res, next) => {
    const {id} = req.params;
    if(!id)
        return next(new ErrorResponse("Invalid user id.", 400));
    const user = await User.findById(id).select("-password -updatedAt -__v");
    if(!user)
        return new ErrorResponse("User not found.", 400)
    const userObject = user.toObject();
    // userObject.imageData = userObject.imageData?.toString("base64");
    userObject.resumeUrl = userObject?.resumePublicId ? genCloudinaryPublicUrl(userObject?.resumePublicId) : null;
    const {resumePublicId, role, imageData, ...rest} = userObject;
    return res.status(200).json(new SuccessResponse("User found successfully", rest))
}

export const uploadProfilePicture = async (req, res, next) => {
    const user = await User.findById(req.userId);
    if(!user)
        return next(new ErrorResponse("User not found.", 400));
    user.imageData = req.file.buffer;
    await user.save();
    return res.status(201).json(new SuccessResponse("Profile uploaded successfully.", {}))
}

export const getProfilePicture = async (req, res,next) => {
    const user = await User.findById(req.userId).select("imageData -_id");
    return res.send(user?.imageData);
}

export const addEducation = async (req, res, next) => {
    const {validatedBody} = req;
    const user = await User.findById(req.userId);
    if(!user || user?.role !== "user")
        return next(new ErrorResponse("User not found.", 400));
    user.education = validatedBody?.education;
    await user?.save();
    return res.status(200).json(new SuccessResponse("Education created successfully.", {}))
}

export const getUserEducation = async (req, res, next) => {
    const user = await User.findById(req.userId).select("education role -_id");
    if(!user || user?.role !== "user")
        return next(new ErrorResponse("User not found.", 400));
    return res.status(200).json(new SuccessResponse("Education found successfully.", user.education))
}

export const uploadResume = async (req, res, next) => {
    const user = await User.findById(req.userId);
    if(!user)
        return next(new ErrorResponse("User not found", 400));
    if(user?.role !== "user")
        return next(new ErrorResponse("Unauthorized access", 400));
    if(!req.file)
        return next(new ErrorResponse("Provide file", 400));
    if(!!user?.resumePublicId){
        const options = {resource_type: "raw", type: "authenticated"};
       const res =  await cloudinary.uploader.destroy(user?.resumePublicId, options);
    }
    const resumeData = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: "jobPortal/resume",
                type: "authenticated",
                resource_type: "raw",
                format: "pdf"
            },
            (error, uploadResult) => {
            if (error) {
                return reject(error);
            }
            return resolve(uploadResult);
        }).end(req.file.buffer);
    })
    user.resumePublicId = resumeData?.public_id;
    user.resumeUploadedDate = new Date();
    await user.save();
    return res.status(200).json(new SuccessResponse("Resume uploaded successfully", {}))
}

export const getResumeUrl = async (req, res, next) => {
    const publicId = req.query?.publicId;
    if(!publicId)
        return next(new ErrorResponse("Provide valid resume id", 400));
    const url = genCloudinaryPublicUrl(publicId);
    return res.status(200).json(new SuccessResponse("Url generated successfully", {url}))
}