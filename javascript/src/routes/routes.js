import { Router } from "express";
import auth from "../middleware/auth.middleware.js";
import { isTeacher, isStudent, isClassOwner } from "../middleware/role.middleware.js";
import { registerUser, loginUser, getCurrentUser } from "../controllers/auth.controller.js";
import { createClass, addStudent, getClass, getStudents } from "../controllers/class.controller.js";
import { startAttendance, getMyAttendance } from "../controllers/attendance.controller.js";

const router = Router();

// Auth
router.post("/auth/signup", registerUser);
router.post("/auth/login", loginUser);
router.get("/auth/me", auth, getCurrentUser);

// Class
router.post("/class", auth, isTeacher, createClass);
router.post("/class/:id/add-student", auth, isTeacher, isClassOwner, addStudent);
router.get("/class/:id", auth, getClass); // Shared access, logic inside controller
router.get("/students", auth, isTeacher, getStudents);

// Attendance
router.post("/attendance/start", auth, isTeacher, isClassOwner, startAttendance);
router.get("/class/:id/my-attendance", auth, isStudent, getMyAttendance); // Spec says student only

export default router;
