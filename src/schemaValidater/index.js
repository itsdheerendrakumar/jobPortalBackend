import Joi from "joi";

export const reviewerResponseToApplicationSchema = Joi.object({
    docId: Joi.string(),
    reviewerStatus: Joi.string().valid("selected", "rejected"),
    reason: Joi.string().trim().min(10).max(200)
}).required();