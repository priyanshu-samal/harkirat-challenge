import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import User from "../models/user.model.js";

const signupSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["teacher", "student"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const registerUser = async (req, res) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: "Invalid request schema" });
    }
    const { name, email, password, role } = result.data;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, error: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
      role,
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, error: "Invalid request schema" });
    }
    const { email, password } = result.data;

    const user = await User.findOne({ email }).select("+password"); // Need +password since select is usually excluded or not? default is included unless select: false in schema.
    // Wait, Mongoose doesn't support select: false by default unless specified. In schema I didn't specify select: false. 
    // But good practice to be explicit if I change schema later. 
    // Actually, earlier code had .select("+password"). If schema doesn't have select:false, this does nothing harmful.
    
    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ success: false, error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET
    );

    return res.status(200).json({
      success: true,
      data: { token },
    });
  } catch {
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: req.user,
  });
};
