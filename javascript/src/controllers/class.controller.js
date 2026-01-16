import ClassModel from "../models/class.model.js";
import User from "../models/user.model.js";
import { z } from "zod";

const createClassSchema = z.object({
  className: z.string().min(1),
});

const addStudentSchema = z.object({
  email: z.string().email(),
});

export const createClass = async (req, res) => {
  try {
    const result = createClassSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: "Invalid request schema" });
    }

    const newClass = await ClassModel.create({
      className: result.data.className,
      teacherId: req.user._id,
      studentIds: [],
    });

    res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const addStudent = async (req, res) => {
  try {
    const result = addStudentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    const { email } = result.data;
    
    // Verify student exists and is a student
    const student = await User.findOne({ email });
    if (!student) {
        return res.status(404).json({ success: false, error: "Student not found" });
    }
    
    if (student.role !== "student") {
         return res.status(400).json({ success: false, error: "User is not a student" });
    }

    const classDoc = req.class; // Attached by isClassOwner middleware
    const studentId = student._id;
    
    if (!classDoc.studentIds.includes(studentId)) {
      classDoc.studentIds.push(studentId);
      await classDoc.save();
    }

    // Populate generic data for returning or just return doc
    res.status(200).json({ success: true, data: classDoc });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getClass = async (req, res) => {
  try {
    const { id } = req.params;
    const classDoc = await ClassModel.findById(id).populate("studentIds"); // "students" in response, stored as studentIds

    if (!classDoc) {
      return res.status(404).json({ success: false, error: "Class not found" });
    }

    // Role Check: Teacher Owner OR Student Enrolled
    const isOwner = classDoc.teacherId.toString() === req.user._id.toString();
    const isEnrolled = classDoc.studentIds.some(s => s._id.toString() === req.user._id.toString());

    if (!isOwner && !isEnrolled) {
       return res.status(403).json({ success: false, error: "Forbidden, access denied" });
    }

    // Map to match spec: "students": [] instead of "studentIds": []
    const responseData = classDoc.toObject();
    responseData.students = responseData.studentIds;
    delete responseData.studentIds;

    res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getStudents = async (req, res) => {
    try {
        const students = await User.find({ role: "student" }).select("-password");
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server error" });
    }
}
