import express from "express";
import { catchHandler } from "../utils/catchHandler.js";
import { tokenValidater } from "../middleware/validateToken.js";
import { applyJob, assignJobToReviewer, findAppliedJobListing, getAssignedJob } from "../controller/appliedJob/index.js";
import { validateRole } from "../middleware/validateRole.js";
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

router.get(
    "/assigned-job",
    catchHandler(tokenValidater),
    catchHandler(validateRole(["reviewer"])),
    catchHandler(getAssignedJob)
)
export default router;