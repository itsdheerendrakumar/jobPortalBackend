import { User } from "../model/userModel.js"
import { ErrorResponse } from "../utils/errorResponse.js";

export const validateRole = (role) => {
    return async (req, res, next) => {
        const user = await User.findById(req?.userId);
        if(!user || user?.status !== "active")
            return next(new ErrorResponse("User does not found", 400));
        if(req.path === "/reviewer-status" && !user?.deletePermission )
            return next(new ErrorResponse("You don't have permission to change reviewer status", 400));
        if(role.includes(user?.role))
            return next()
        else
            return next(new ErrorResponse("Unauthorized access", 400));
    }
}