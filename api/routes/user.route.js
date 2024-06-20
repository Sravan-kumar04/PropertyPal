import express from "express";
import {
  deleteUser,
  getUser,
  getUsers,
  updateUser,
  savePost,
  profilePosts,
  getNotificationNumber
} from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();
router.get("/", getUsers);
// router.get("/:id", verifyToken, getUser);
router.patch("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, deleteUser);

router.post("/save", verifyToken, savePost);
router.get("/notification", verifyToken, getNotificationNumber);
router.get("/profilePosts", verifyToken, profilePosts);
export default router;
