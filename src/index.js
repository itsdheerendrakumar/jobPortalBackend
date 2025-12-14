import express from "express"
import env from "dotenv"
import cors from "cors"
import { connectDb } from "./utils/connectDb.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import jobRouter from "./routes/jobRoutes.js";
import appliedJobRouter from "./routes/applyJobRoutes.js"
env.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/applied-job", appliedJobRouter);

app.use((err, req, res, next) => {
    const statusCode = err?.status ?? 500
    const message = err?.message
    return res.status(statusCode).json({ message });
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    message: "Service is healthy and running",
  });
});


(() => {
    connectDb()
        .then(() => {
            app.listen(process.env.PORT, () => { console.log("server is listening on: ", process.env.PORT) })
        })
        .catch((err) => console.log("error occred in connecting db", err));
})()
