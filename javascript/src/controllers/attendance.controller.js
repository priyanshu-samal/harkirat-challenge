import { z } from "zod";
import AttendanceModel from "../models/attendence.model.js";
import { startSession } from "../state.js";

const startSchema = z.object({
  classId: z.string(),
});

export const startAttendance = async (req, res) => {
  try {
    const result = startSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: "Invalid request schema" });
    }

    // Note: isClassOwner middleware should have been run before this to ensure ownership
    // But passing classId in body means we need to verify it.
    // If we use middleware on this route, we are good.
    
    // Init session in global state
    const session = startSession(result.data.classId);

    res.status(200).json({
      success: true,
      data: {
        classId: session.classId,
        startedAt: session.startedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getMyAttendance = async (req, res) => {
  try {
     const { id } = req.params; // classId
     const userId = req.user._id;

     // Check DB
     const record = await AttendanceModel.findOne({ classId: id, studentId: userId });

     if (record) {
         return res.status(200).json({
             success: true,
             data: {
                 classId: id,
                 status: record.status
             }
         });
     }

     return res.status(200).json({
        success: true,
        data: {
            classId: id,
            status: null
        }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};
