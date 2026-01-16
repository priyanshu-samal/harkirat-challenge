import { Router } from "express";
//import middleware from "../middleware/middleware.js";

const router = Router();

router.get("/test",(req, res) => {
  res.json({ message: "Route working" });
});

export default router;
