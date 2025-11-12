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
    const jobs = await AppliedJob.find({reviewerId: {$exists: false}})
    .select("createdAt jobId userId")
    .populate({path: "jobId", select: "jobTitle deadline category -_id"})
    .populate({path: "userId", select: "name -_id"});
    return res.status(200).json(new SuccessResponse("Applied job found succcessfully", jobs))
}

export const assignJobToReviewer = async (req, res, next) => {
    const {docId, reviewerId} = req.body;
    const p1 = AppliedJob.findById(docId);
    const p2 = User.findById(reviewerId);
    const [appliedJob, user] = await Promise.all([p1, p2]);
    if(!appliedJob || !user)
        return next(new ErrorResponse("Bad request", 400))
    appliedJob.reviewerId = reviewerId;
    await appliedJob.save();
    return res.status(200).json(new SuccessResponse('Reviewer added successfully', {}))
}

export const getAssignedJob = async (req, res, next) => {
    const {userId} = req;

    const assignedApplication = await AppliedJob.aggregate([
        {
            $match: {reviewerId: new mongoose.Types.ObjectId(userId)}
        },
        {
            $group: {
                _id: "$jobId",
                assignedJob: {
                    $push: {userId: "$userId"}
                },
                appliedDates: {$push: "$createdAt"},
                documentIds: {$push: "$_id"}
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "assignedJob.userId",
                foreignField: "_id",
                as: "applicantDetail"
            }
        },
        {
            $lookup: {
                from: "jobs",
                localField: "_id",
                foreignField: "_id",
                as: "jobDetails"
            }
        },
        {
            $project: {
                _id: 0,
                "applicantDetail.password": 0,
                assignedJob: 0,
                "jobDetails.minSalary": 0,
                "jobDetails.maxSalary": 0,
                "jobDetails.vacancy": 0,
                "jobDetails.__v": 0,
                "jobDetails.updatedAt": 0,
                "jobDetails.createdBy": 0,
                "jobDetails.location": 0,
                "jobDetails.jobType": 0,
                "jobDetails.category": 0,
                "jobDetails.deadline": 0,
                "jobDetails.createdAt": 0,
            }
        }
    ])
    return res.status(200).json(new SuccessResponse(
        "Assigned job found successfully", 
        assignedApplication?.[0] ? {...assignedApplication?.[0], jobDetails: assignedApplication?.[0]?.jobDetails?.[0]} : {}
    ))
}
