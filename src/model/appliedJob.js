import mongoose from "mongoose";
import { applicationStatus } from "../constants/enums.js";

const appliedJobSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Types.ObjectId,
        ref: "Job"
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    reviewerId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    adminId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    reviewerStatus: {
        type: String,
        enum: applicationStatus,
        default: "pending",
    },
    adminStatus: {
        type: String,
        enum: applicationStatus,
        default: "pending",
    },
    reason: {
        type: String,
    }
}, {timestamps: true});

export const AppliedJob = mongoose.model("AppliedJob", appliedJobSchema);