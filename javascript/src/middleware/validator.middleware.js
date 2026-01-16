import { body, validationResult } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const registerUserValidator = [
  body("username").notEmpty().isString().isLength({ min: 3 }),
  body("email").notEmpty().isEmail(),
  body("password").notEmpty().isLength({ min: 6 }),
  body("role").optional().isIn(["user", "seller"]),
  validate,
];

export const loginUserValidator = [
  body("password").notEmpty(),
  body("email").optional().isEmail(),
  body("username").optional(),
  validate,
];
