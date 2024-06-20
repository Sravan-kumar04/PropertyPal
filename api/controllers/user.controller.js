import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      message: "Failed to get users",
      error: error.message,
    });
  }
};

export const getUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      message: "Failed to get user",
      error: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(403).json({
      message: "Not Authorized",
    });
  }

  const { password, avatar, ...inputs } = req.body;

  console.log("req.body", req.body);

  try {
    let updatedPassword = null;

    if (password) {
      updatedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...inputs,
        ...(updatedPassword && { password: updatedPassword }),
        ...(avatar && { avatar }),
      },
    });

    res.status(200).json({
      updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  if (id !== tokenUserId) {
    return res.status(403).json({
      message: "Not Authorized",
    });
  }

  try {
    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

export const savePost = async (req, res) => {
  const postId = req.body.postId;
  const tokenUserId = req.userId;
  console.log(postId + " " + tokenUserId);

  try {
    const savedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: tokenUserId,
          postId,
        },
      },
    });

    if (savedPost) {
      await prisma.savedPost.delete({
        where: {
          id: savedPost.id,
        },
      });
      return res.status(200).json({
        message: "Post removed successfully",
      });
    } else {
      await prisma.savedPost.create({
        data: {
          userId: tokenUserId,
          postId,
        },
      });

      return res.status(200).json({
        message: "Post saved successfully",
      });
    }
  } catch (error) {
    console.error("Error while saving post: ", error);
    return res.status(500).json({
      message: "Failed to save post",
      error: error.message,
    });
  }
};


export const profilePosts = async (req, res) => {
  const tokenUserId = req.params.userId;
  try {
    const userPosts = await prisma.post.findMany({
      where: { userId: tokenUserId },
    });

    const saved = await prisma.savedPost.findMany({
      where: { userId: tokenUserId },
      include: {
        post: true,
      },
    });

    const savedPosts = saved.map((item) => item.post);

    return res.status(200).json({
      userPosts,
      savedPosts,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return res.status(500).json({
      message: "Failed to get profile posts",
      error: error.message,
    });
  }
};





export const getNotificationNumber = async (req, res) => {
  const tokenUserId = req.userId;
  try {

    const number=await prisma.chat.count({
      where:{
        userIDs:{
          hasSome:[tokenUserId],
        },
        NOT:{
          seenBy:{
            hasSome:[tokenUserId]
          }
        }
      }
    })
   
    return res.status(200).json(number);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return res.status(500).json({
      message: "Failed to get profile posts",
      error: error.message,
    });
  }
};
