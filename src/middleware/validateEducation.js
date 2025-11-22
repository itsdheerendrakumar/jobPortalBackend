import { userEducationSchema } from "../schemaValidater/signupValidater.js";

export const validateEducation = async (req, res, next) => {
    const {education} = req.body;
    const validatedBody = await userEducationSchema.validateAsync({education});
    req.validatedBody = validatedBody;
    next();
}