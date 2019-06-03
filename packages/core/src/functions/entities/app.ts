import cors from "cors";
import express from "express";

import formats from "./formats";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/formats", formats);

export default app;
