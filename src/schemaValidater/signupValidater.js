import Joi from "joi";

export const commonSignupSchemaValidater = Joi.object({
    name: Joi.string().trim().min(2).max(20).pattern(/^[A-Za-z ]+$/, "Nsame will contain alphabets only").required(),
    email: Joi.string().trim().max(40).email().required(),
    password: Joi.string().trim().min(6).max(15).required(),
    phone: Joi.string().trim().min(4).max(13).pattern(/^[0-9]+$/, "Phone will contain digits only").required(),
    country: Joi.string().trim().max(40).required()
});

export const userEducationSchema = Joi.object({
    education: Joi.array().items(Joi.object({
        name: Joi.string().trim(),
        collegeName: Joi.string().trim(),
        percentage: Joi.string().trim(),
        passYear: Joi.alternatives()
        .try(
            Joi.string().trim(),
            Joi.number()
        ),


    })).required()
})