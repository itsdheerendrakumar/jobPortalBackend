import { Job } from "../../model/jobModel.js";
import { ErrorResponse } from "../../utils/errorResponse.js";
import { SuccessResponse } from "../../utils/successResponse.js";

export const createJob = async (req, res, next) => {
    const {userId} = req;
    const job = await Job.insertOne({...req?.validatedData, createdBy: userId})
    res.status(201).json(new SuccessResponse("Job created successfully", job));
}

export const getJobListing = async (req, res, next) => {
    const jobs = await Job.find(
        {}, 
        {
            companyName: 1, 
            createdAt: 1, 
            experience: 1, 
            jobTitle: 1, 
            jobType: 1,
            location: 1,
            minSalary: 1,
            maxSalary: 1,
            createdBy: 1,
            vacancy: 1,
            deadline: 1
        }
    );
    return res.status(200).json(new SuccessResponse("Jobs found successfully", jobs));
}

export const getJobById = async (req, res, next) => {
    const {jobId} = req.params;
    if(!jobId)
        return next(new ErrorResponse("Please provide valid id", 400));
    const job = await Job.findById(jobId);
    if(!job)
        return next(new ErrorResponse("No job found with this id", 400));
    return res.status(200).json(new SuccessResponse("Job found successfully", job))
}

export const extendDeadline = async (req, res, next) => {
    const {newDeadline, jobId} = req.body;
    if(!newDeadline || !jobId)
        return next(new ErrorResponse("Deadline and job are required", 400));
    const job = await Job.findById(jobId);
    if(!job)
        return next(new ErrorResponse("Invalid job id", 400));
    job.deadline = new Date(newDeadline);
    await job.save();
    res.status(200).json(new SuccessResponse("Deadline changed successfully", {}))
}