import cors from "cors";
import express from "express";
import fileTransferNotifications from "./file-transfer-notifications";

const app = express();

app.use(express.json());
app.use(cors());
app.use("/file-transfers/notifications", fileTransferNotifications);

export default app;
