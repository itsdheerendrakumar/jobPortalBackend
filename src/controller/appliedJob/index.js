import { AppliedJob } from "../../model/appliedJob.js";
import { Job } from "../../model/jobModel.js";
import { User } from "../../model/userModel.js";
import { ErrorResponse } from "../../utils/errorResponse.js";
import { SuccessResponse } from "../../utils/successResponse.js";
import mongoose, { Error } from "mongoose";

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
    const alreadyApplied = await AppliedJob.findOne({userId, jobId});
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
            $match: {
                reviewerId: new mongoose.Types.ObjectId(userId), 
                reviewerStatus: "pending"
            }
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
    console.log(assignedApplication)
    return res.status(200).json(new SuccessResponse(
        "Assigned job found successfully", 
        assignedApplication
    ))
}

export const reviewerResponseOnAppliedJob = async (req, res, next) => {
    const {docId, reviewerStatus, reason} = req.validatedBody;
    console.log(req.validatedBody)
    const appliedJob = await AppliedJob.findById(new mongoose.Types.ObjectId(docId));
    if(!appliedJob)
        return next(new ErrorResponse("Applied job not found", 400));
    appliedJob.reviewerStatus = reviewerStatus;
    appliedJob.reason = reason;
    await appliedJob.save();
    return res.status(200).json(new SuccessResponse("Reviewer response saved successfully", {}))
}

export const getReviewerSelectedApplication = async (req, res, next) => {
    const {userId} = req;
    // const selectedApplications = await AppliedJob.find({adminId: new mongoose.Types.ObjectId(userId), reviewerStatus: "selected"})
    // .populate({path: "jobId", select: "jobTitle"})
    // .populate({path: "userId", select: "name email phone"})
    // .populate({path: "reviewerId", select: "name email phone -_id"});
    // return res.status(200).json(new SuccessResponse("Selected application found successfully", selectedApplications))
    const data = await AppliedJob.aggregate([
        {
            $lookup: {
                from: "jobs",
                localField: "jobId",
                foreignField: "_id",
                as: "jobDetails"
            }
        },
        {
            $match: {
                "jobDetails.createdBy": new mongoose.Types.ObjectId(userId),
                reviewerStatus: "selected",
                adminStatus: "pending",
            }
        },
        {
            $project: {
                reason: 1,
                reviewerId: 1,
                userId: 1,
                jobDetails: {
                    companyName: {$first: "$jobDetails.companyName"},
                    jobTitle: {$first: "$jobDetails.jobTitle"},
                    jobId: {$first: "$jobDetails._id"}
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "applicantDetail"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "reviewerId",
                foreignField: "_id",
                as: "reviewerDetail"
            }
        },
        {
            $project: {
                reason: 1,
                reviewerDetail: {$first: "$reviewerDetail"},
                applicantDetail: {$first: "$applicantDetail"},
                jobDetails: {$first: "$jobDetails"},
            }
        },
        {
            $project: {
                reason: 1,
                "reviewerDetail.name": 1,
                "reviewerDetail.email": 1,
                "applicantDetail.name": 1,
                "applicantDetail._id": 1,
                "applicantDetail.skills": 1,
                jobDetails: 1
            }
        }
       
    ])
    res.status(200).json(new SuccessResponse("Reviewed application found successfully", data))
}

export const adminResponseToApplication = async (req, res, next) => {
    const {docId, adminStatus} = req.body;
    if(!docId || ["pending", "rejected"].includes(adminStatus))
        return next(new ErrorResponse("Validation failed", 400));
    const application = await AppliedJob.findById(docId);
    if(!application)
        return next(new ErrorResponse("Application does not exist", 400));
    if(["selected", "rejected"].includes(application?.adminStatus))
        return next(new ErrorResponse("Admin response already submitted"))
    application.adminStatus = adminStatus;
    await application.save();
    return res.status(200).json(new SuccessResponse("Response saved successfully", {}));
}

export const getSelectedApplicationByAdmin = async (req, res, next) => {
    const {userId} = req;
    const data = await AppliedJob.aggregate([
        {
            $lookup: {
                from: "jobs",
                localField: "jobId",
                foreignField: "_id",
                as: "jobDetails"
            }
        },
        {
            $match: {
                "jobDetails.createdBy": new mongoose.Types.ObjectId(userId),
                adminStatus: "selected",
            }
        },
        {
            $project: {
                reason: 1,
                reviewerId: 1,
                userId: 1,
                jobDetails: {
                    companyName: {$first: "$jobDetails.companyName"},
                    jobTitle: {$first: "$jobDetails.jobTitle"},
                    jobId: {$first: "$jobDetails._id"}
                }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "applicantDetail"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "reviewerId",
                foreignField: "_id",
                as: "reviewerDetail"
            }
        },
        {
            $project: {
                reason: 1,
                reviewerDetail: {$first: "$reviewerDetail"},
                applicantDetail: {$first: "$applicantDetail"},
                jobDetails: {$first: "$jobDetails"},
            }
        },
        {
            $project: {
                reason: 1,
                "reviewerDetail.name": 1,
                "reviewerDetail.email": 1,
                "applicantDetail.name": 1,
                "applicantDetail._id": 1,
                "applicantDetail.skills": 1,
                jobDetails: 1
            }
        }
       
    ])
    return res.status(200).json(new SuccessResponse("Selected application found successfully", data))
}

export const getAppliedJobForUser = async (req, res, next) => {
    const {userId} = req;
    const appliedJobs = await AppliedJob.find({userId})
    .select("adminStatus reviewerStatus createdAt jobId -_id")
    .populate({path: "jobId", select: "jobTitle companyName location jobType deadline _id"});
    return res.status(200).json(new SuccessResponse("Applied jobs found successfully", appliedJobs))
}