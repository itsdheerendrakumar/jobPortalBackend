import { reviewerResponseToApplicationSchema } from "../schemaValidater/index.js";

export const reviewerResponseToAppliedJob = async (req, res, next) => {
    const validatedBody = await reviewerResponseToApplicationSchema.validateAsync(req.body);
    req.validatedBody = validatedBody;
    next();
}