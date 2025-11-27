import express from "express";
import { catchHandler } from "../utils/catchHandler.js";
import { tokenValidater } from "../middleware/validateToken.js";
import { applyJob, assignJobToReviewer, findAppliedJobListing, getAssignedJob, getReviewerSelectedApplication, reviewerResponseOnAppliedJob } from "../controller/appliedJob/index.js";
import { validateRole } from "../middleware/validateRole.js";
import { reviewerResponseToAppliedJob } from "../middleware/reviewerResponseToAppliedJob.js";
const router = express.Router();

router.route("/")
.post(
    catchHandler(tokenValidater),
    catchHandler(applyJob)
)
.get(
    catchHandler(tokenValidater),
    catchHandler(validateRole(["admin"])),
    catchHandler(findAppliedJobListing)
)
router.patch(
    "/assign-reviewer",
    catchHandler(tokenValidater),
    catchHandler(validateRole(["admin"])),
    catchHandler(assignJobToReviewer)
)

router.route("/assigned-job")
.get(
    catchHandler(tokenValidater),
    catchHandler(validateRole(["reviewer"])),
    catchHandler(getAssignedJob)
)
.patch(
    catchHandler(tokenValidater),
    catchHandler(validateRole(["reviewer"])),
    catchHandler(reviewerResponseToAppliedJob),
    catchHandler(reviewerResponseOnAppliedJob)
)

router.get(
    "/selected-application-by-reviewer",
    catchHandler(tokenValidater),
    catchHandler(validateRole(["admin"])),
    catchHandler(getReviewerSelectedApplication)
)

export default router;