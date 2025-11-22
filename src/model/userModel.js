import  mongoose from "mongoose";
import { userRoles, userStatus } from "../constants/enums.js";

const userSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    phone: {
        type: String
    },
    country: {
        type: String
    },
    role: {
        type: String,
        enum: userRoles
    },
    deletePermission: {
        type: Boolean
    },
    status: {
        type: String,
        enum: userStatus,
        default: "active"
    },
    imageData: {
        type: Buffer
    },
    resumeUrl: {
        type: String
    },
    skills: {
        type: {String}
    },
    education: [{
        _id: false,
        name: String,
        percentage: String,
        collegeName: String,
        passYear: Number
    }]
}, {timestamps: true})

export const User = mongoose.model("User", userSchema);