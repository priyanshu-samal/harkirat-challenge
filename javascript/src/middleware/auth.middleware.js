import jwt from "jsonwebtoken";
import User from "../models/user.models.js";

export default async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) throw new Error();

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
}
