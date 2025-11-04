import express from "express";
import { catchHandler } from "../utils/catchHandler.js";
import { tokenValidater } from "../middleware/validateToken.js";
import { applyJob, findAppliedJobListing } from "../controller/appliedJob/index.js";
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

export default router;