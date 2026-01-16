import { Router } from "express";
import auth from "../middleware/auth.middleware.js";
import {
  registerUser,
  loginUser,
  getCurrentUser,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/auth/signup", registerUser);
router.post("/auth/login", loginUser);
router.get("/auth/me", auth, getCurrentUser);

export default router;
