import mongoose from "mongoose";

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
    isSelectedByReviewer: {
        type: Boolean,
        default: false,
    },
    isSelectedByAdmin: {
        type: Boolean,
        default: false,
    },
    reason: {
        type: String,
        required: true
    }
}, {timestamps: true});

export const AppliedJob = mongoose.model("AppliedJob", appliedJobSchema);