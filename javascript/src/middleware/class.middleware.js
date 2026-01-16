import Class from "../models/class.model.js";

export const isClassTeacher = async (req, res, next) => {
  const cls = await Class.findById(req.params.id || req.body.classId);
  if (!cls) {
    return res.status(404).json({ success: false, error: "Class not found" });
  }

  if (!cls.teacherId.equals(req.user._id)) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  req.class = cls;
  next();
};
