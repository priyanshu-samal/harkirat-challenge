import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import AttendanceModel from "../models/attendence.model.js";
import { state, resetSession } from "../state.js";

export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (ws, req) => {
    // 1. Auth via query param
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get("token");

    if (!token) {
      ws.send(JSON.stringify({ event: "ERROR", data: { message: "Unauthorized or invalid token" } }));
      return ws.close();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      
      if (!user) throw new Error();
      ws.user = user;
    } catch (err) {
      ws.send(JSON.stringify({ event: "ERROR", data: { message: "Unauthorized or invalid token" } }));
      return ws.close();
    }

    console.log(`User connected: ${ws.user.name} (${ws.user.role})`);

    ws.on("message", async (message) => {
      try {
        const parsed = JSON.parse(message);
        const { event, data } = parsed;

        if (event === "ATTENDANCE_MARKED") {
          handleAttendanceMarked(ws, data, wss);
        } else if (event === "TODAY_SUMMARY") {
          handleTodaySummary(ws, wss);
        } else if (event === "MY_ATTENDANCE") {
          handleMyAttendance(ws);
        } else if (event === "DONE") {
          await handleDone(ws, wss);
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    });
  });
};

const broadcast = (wss, message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(message));
    }
  });
};

const handleAttendanceMarked = (ws, data, wss) => {
  if (ws.user.role !== "teacher") {
    return ws.send(JSON.stringify({ event: "ERROR", data: { message: "Forbidden, teacher event only" } }));
  }

  if (!state.activeSession) {
    return ws.send(JSON.stringify({ event: "ERROR", data: { message: "No active attendance session" } }));
  }

  const { studentId, status } = data;
  if (!studentId || !status) return;

  // Update memory
  state.activeSession.attendance[studentId] = status;

  // Broadcast
  broadcast(wss, {
    event: "ATTENDANCE_MARKED",
    data: { studentId, status },
  });
};

const handleTodaySummary = (ws, wss) => {
  if (ws.user.role !== "teacher") {
    return ws.send(JSON.stringify({ event: "ERROR", data: { message: "Forbidden, teacher event only" } }));
  }

  if (!state.activeSession) {
    return ws.send(JSON.stringify({ event: "ERROR", data: { message: "No active attendance session" } }));
  }

  const attendance = state.activeSession.attendance;
  const total = Object.keys(attendance).length;
  const present = Object.values(attendance).filter((s) => s === "present").length;
  const absent = total - present;

  broadcast(wss, {
    event: "TODAY_SUMMARY",
    data: { present, absent, total },
  });
};

const handleMyAttendance = (ws) => {
  if (ws.user.role !== "student") {
    return ws.send(JSON.stringify({ event: "ERROR", data: { message: "Forbidden, student event only" } }));
  }

  if (!state.activeSession) {
     return ws.send(JSON.stringify({ event: "ERROR", data: { message: "No active attendance session" } }));
  }

  const status = state.activeSession.attendance[ws.user._id.toString()] || "not yet updated";

  ws.send(JSON.stringify({
    event: "MY_ATTENDANCE",
    data: { status },
  }));
};

const handleDone = async (ws, wss) => {
  if (ws.user.role !== "teacher") {
    return ws.send(JSON.stringify({ event: "ERROR", data: { message: "Forbidden, teacher event only" } }));
  }

  if (!state.activeSession) {
     return ws.send(JSON.stringify({ event: "ERROR", data: { message: "No active attendance session" } }));
  }

  const { classId, attendance } = state.activeSession;

  // 1. Get all students in the class
  // We need to import ClassModel to find students who were NOT marked and default them to absent?
  // Spec says: "Mark absent students in memory" (step 3 of DONE)
  // This implies we need to know who belongs to the class.
  // Let's import ClassModel.
  
  // Dynamic import or top level? Top level is fine.
  // Waiting for ClassModel implementation details... imported it below.
  const ClassModel = (await import("../models/class.model.js")).default;
  
  const classDoc = await ClassModel.findById(classId);
  if (!classDoc) {
      return ws.send(JSON.stringify({ event: "ERROR", data: { message: "Class not found" } }));
  }

  // Mark unmarked students as absent
  classDoc.studentIds.forEach(studentIdObj => {
      const sId = studentIdObj.toString();
      if (!attendance[sId]) {
          attendance[sId] = "absent";
      }
  });

  // Persist to DB
  const operations = Object.entries(attendance).map(([studentId, status]) => ({
      insertOne: {
          document: {
              classId: classId,
              studentId: studentId,
              status: status
          }
      }
  }));

  if (operations.length > 0) {
      await AttendanceModel.bulkWrite(operations);
  }

  // Calc final summary
  const total = Object.keys(attendance).length;
  const present = Object.values(attendance).filter((s) => s === "present").length;
  const absent = total - present;

  // Clear memory
  resetSession();

  // Broadcast
  broadcast(wss, {
    event: "DONE",
    data: {
      message: "Attendance persisted",
      present,
      absent,
      total,
    },
  });
};
