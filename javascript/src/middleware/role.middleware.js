import ClassModel from "../models/class.model.js";

export const isTeacher = (req, res, next) => {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ success: false, error: "Forbidden, teacher access required" });
  }
  next();
};

export const isStudent = (req, res, next) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, error: "Forbidden, student access required" });
  }
  next();
};

export const isClassOwner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classId = req.body.classId || id;

    if (!classId) {
       return res.status(400).json({ success: false, error: "Class ID required" });
    }

    const classDoc = await ClassModel.findById(classId);
    
    if (!classDoc) {
      return res.status(404).json({ success: false, error: "Class not found" });
    }

    if (classDoc.teacherId.toString() !== req.user._id.toString()) {
       return res.status(403).json({ success: false, error: "Forbidden, not class teacher" });
    }

    req.class = classDoc;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
