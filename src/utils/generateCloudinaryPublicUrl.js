import { cloudinary } from "./cloudnarySetup.js"

export const genCloudinaryPublicUrl = (publicId) => {
        const options = {
        type: "authenticated",
        resource_type: "raw",
        sign_url: true,
    }
    const url = cloudinary.url(publicId, options);
    return url;
}