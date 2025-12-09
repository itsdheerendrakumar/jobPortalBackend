import express from "express";
import { validateCommonSignup } from "../middleware/validateCommonSignup.js";
import { createUser, deleteAdmin, getUserListing, getSuperAdminMetrics, updateAdminStatus, promoteReviewer, getUserSelectListing, getTypeUserById, uploadProfilePicture, getProfilePicture, addEducation, getUserEducation, uploadResume, getResumeUrl, updateReviewerStatus } from "../controller/user/index.js";
import { tokenValidater } from "../middleware/validateToken.js";
import { catchHandler } from "../utils/catchHandler.js";
import { validateRole } from "../middleware/validateRole.js";
import { profilePicture } from "../middleware/profilePicture.js";
import { validateEducation } from "../middleware/validateEducation.js";
import { resume } from "../middleware/resume.js";
const router = express.Router();

router.route("/admin")
.post(
    catchHandler(tokenValidater), 
    catchHandler(validateRole(["superAdmin"])),
    catchHandler(validateCommonSignup),
    catchHandler(createUser("admin"))
)
// router.route("/admin/:adminId")
// .delete(
//     catchHandler(tokenValidater),
//     catchHandler(validateRole(["superAdmin"])),
//     catchHandler(deleteAdmin)
// )

router.route("/reviewer")
.post(
    catchHandler(tokenValidater),
    catchHandler(validateRole(["admin"])),
    catchHandler(validateCommonSignup),
    catchHandler(createUser("reviewer"))
)
// router.patch(
//     "/promote-reviewer",
//     catchHandler(tokenValidater),
//     catchHandler(validateRole(["superAdmin"])),
//     catchHandler(promoteReviewer)
// )

router.get(
    "/admin-metrics",
    catchHandler(tokenValidater), 
    catchHandler(validateRole(["superAdmin", "admin", "reviewer"])),
    catchHandler(getSuperAdminMetrics)
);
router.get(
    "/admin-listing", 
    catchHandler(tokenValidater), 
    catchHandler(validateRole(["superAdmin"])),
    catchHandler(getUserListing("admin"))
);
router.get(
    "/reviewer-listing", 
    catchHandler(tokenValidater), 
    catchHandler(validateRole(["superAdmin", "admin"])),
    catchHandler(getUserListing("reviewer"))
);

router.patch(
    "/admin-status",
    catchHandler(tokenValidater), 
    catchHandler(validateRole(["superAdmin"])),
    catchHandler(updateAdminStatus)
)
router.patch(
    "/reviewer-status",
    catchHandler(tokenValidater), 
    catchHandler(validateRole(["admin"])),
    catchHandler(updateReviewerStatus)
)

router.post(
    "/user",
    catchHandler(validateCommonSignup),
    catchHandler(createUser("user"))
)

router.get(
    "/user/:id",
    catchHandler(tokenValidater),
    catchHandler(validateRole(["user", "admin", "reviewer"])),
    catchHandler(getTypeUserById)
)

router.get(
    "/select-listing",
    catchHandler(tokenValidater),
    catchHandler(validateRole(["admin"])),
    catchHandler(getUserSelectListing)
)

router.route("/profile")
.post(
    catchHandler(tokenValidater),
    catchHandler(profilePicture),
    catchHandler(uploadProfilePicture)
)
.get(
    catchHandler(tokenValidater),
    catchHandler(getProfilePicture)
)

router.route("/education")
.post(
    catchHandler(tokenValidater),
    catchHandler(validateEducation),
    catchHandler(addEducation)
)
.get(
    catchHandler(tokenValidater),
    catchHandler(getUserEducation)
)

router.route("/resume")
.post(
    catchHandler(tokenValidater),
    catchHandler(resume),
    catchHandler(uploadResume)
)
.get(
    catchHandler(tokenValidater),
    catchHandler(getResumeUrl)
)

export default router;