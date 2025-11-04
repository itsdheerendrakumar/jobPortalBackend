import { AppliedJob } from "../../model/appliedJob.js";
import { Job } from "../../model/jobModel.js";
import { User } from "../../model/userModel.js";
import { ErrorResponse } from "../../utils/errorResponse.js";
import { SuccessResponse } from "../../utils/successResponse.js";
import mongoose from "mongoose";

export const applyJob = async (req, res, next) => {
    const {userId} = req;
    const {jobId} = req.body;
    if(!jobId)
        return next(new ErrorResponse("Provide job id", 400));
    const [user, job] = await Promise.all([
        User.findById(new mongoose.Types.ObjectId(userId)), 
        Job.findById(new mongoose.Types.ObjectId(jobId))
    ])
    if(!user || user.role !== "user")
        return next(new ErrorResponse("Unauthorized access.", 400));
    if(!job)
        return next(new ErrorResponse("Job does not found", 400));
    if(new Date() >= new Date(job?.deadline))
        return next(new ErrorResponse("Job is expired.", 400));
    const alreadyApplied = await AppliedJob.findOne({userId});
    if(alreadyApplied)
        return next(new ErrorResponse("User has already applied for this job", 400));
    await AppliedJob.insertOne({userId, jobId});
    return res.status(201).json(new SuccessResponse("Applied job successfully", {}))
}

export const findAppliedJobListing = async (req, res, next) => {
    const jobs = await AppliedJob.find({})
    .populate("jobId")
    .populate({path: "userId", select: "-password"});
    return res.status(200).json(new SuccessResponse("Applied job found succcessfully", jobs))
}