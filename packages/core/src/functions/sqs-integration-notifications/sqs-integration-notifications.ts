import { Router } from "express";

import logger from "../../logger";
import { getSQSIntegrationNotificationRepository } from "../../services";

const repository = getSQSIntegrationNotificationRepository();
const router = Router();

router.get("/", async (req, res) => res.json(await repository.findAll()));
router.delete("/:id", async (req, res) => {
  await repository.delete(req.params.id);
  logger.info(`Deleted SQS integration notification ${req.params.id}.`);
  res.json();
});

export default router;
