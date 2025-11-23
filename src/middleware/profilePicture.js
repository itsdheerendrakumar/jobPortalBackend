import multer from "multer";
const storage = multer.memoryStorage()
const upload = multer({
    storage,
    limits: { fileSize: 204800 },
    fileFilter: (req, file, cb) => {
        if(["image/png", "image/jpeg"].includes(file.mimetype))
            cb(null, true)
        else
            return cb(new Error("Invalid file type"), false);
    }
});

export const profilePicture = upload.single("profile");