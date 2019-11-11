import cors from "cors";
import express from "express";
import sqsIntegrationNotifications from "./sqs-integration-notifications";

const app = express();

app.use(express.json());
app.use(cors());
app.use("/sqs-integration/notifications", sqsIntegrationNotifications);

export default app;
