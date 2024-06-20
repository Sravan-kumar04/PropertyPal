import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email or username already exists" });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);
    console.log(hashPassword);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashPassword,
      },
    });

    console.log(newUser);
    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ message: "Username not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const age = 1000 * 60 * 60 * 24 * 7;
    const token = jwt.sign(
      { id: user.id, isAdmin: true },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: age,
      }
    );

    console.log("Token generated:", token);

    const { password: userPassword, ...userInfo } = user;

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: age,
      })
      .status(200)
      .json(userInfo);
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("token").status(200).json({ message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
