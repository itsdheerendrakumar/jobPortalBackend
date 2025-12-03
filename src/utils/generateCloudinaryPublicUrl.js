import { cloudinary } from "./cloudnarySetup.js"

export const genCloudinaryPublicUrl = (publicId) => {
        const options = {
        type: "authenticated",
        resource_type: "raw",
        sign_url: true,
        flags: "attachment",
        expires_at: Math.floor(Date.now() / 1000) + 3600
    }
    const url = cloudinary.utils.private_download_url(`${publicId}`, "pdf", options);
    return url;
}