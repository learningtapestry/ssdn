import { Router } from "express";

import { Format } from "../../interfaces/format";
import { getFormatRepository } from "../../services";

const repository = getFormatRepository();

const router = Router();

router.get("/", async (req, res) => res.json(await repository.findAll()));
router.get("/:name", async (req, res) => res.json(await repository.get(req.params.name)));
router.post("/", async (req, res) => res.json(await repository.put(req.body as Format)));
router.patch("/:name", async (req, res) =>
  res.json(await repository.update(req.params.name, req.body as Format)),
);
router.delete("/:name", async (req, res) => {
  await repository.delete(req.params.name);
  res.json();
});

export default router;
