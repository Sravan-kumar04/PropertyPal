import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";

export const getPosts = async (req, res) => {
  const query = req.query;

  try {
    const posts = await prisma.post.findMany({
      where: {
        city: query.city || undefined,
        type: query.type || undefined,
        property: query.property || undefined,
        bedroom: parseInt(query.bedroom) || undefined,
        price: {
          gte: parseInt(query.minPrice) || undefined,
          lte: parseInt(query.maxPrice) || undefined,
        },
      },
    });

    // setTimeout(() => {
    res.status(200).json(posts);
    // }, 3000);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get posts" });
  }
};

export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        postDetail: true,
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });

    const token = req.cookies?.token;

    if (token) {
      return jwt.verify(
        token,
        process.env.JWT_SECRET_KEY,
        async (err, payload) => {
          if (err) {
            return res.status(200).json({ ...post, isSaved: false });
          }
          const saved = await prisma.savedPost.findUnique({
            where: {
              userId_postId: {
                postId: id,
                userId: payload.id,
              },
            },
          });
          return res
            .status(200)
            .json({ ...post, isSaved: saved ? true : false });
        }
      );
    }
    return res.status(200).json({ ...post, isSaved: false });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to get post" });
  }
};

export const addPost = async (req, res) => {
  const { postData, postDetail } = req.body;
  const userId = req.userId; // Assuming req.userId is set from authentication middleware

  try {
    const newPost = await prisma.post.create({
      data: {
        ...postData,
        userId: userId,
        postDetail: {
          create: postDetail,
        },
      },
      include: {
        postDetail: true,
      },
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error adding post:", error);
    res.status(500).json({ message: "Failed to add post" });
  }
};
export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { postData, postDetail } = req.body;

  try {
    const updatedPost = await prisma.post.update({
      where: { id }, // Use string ID directly
      data: {
        ...postData,
        postDetail: {
          update: postDetail,
        },
      },
    });
    return res.status(200).json(updatedPost);
  } catch (error) {
    console.error("Error updating post:", error);
    return res.status(500).json({ message: "Failed to update post" });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId; // Assuming req.userId is set from authentication middleware

  try {
    const post = await prisma.post.findUnique({
      where: { id }, // Use string ID directly
    });

    if (post && post.userId === userId) {
      await prisma.post.delete({ where: { id } });
      return res.status(200).json({ message: "Post deleted" });
    } else {
      return res
        .status(403)
        .json({ message: "Not authorized or post not found" });
    }
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ message: "Failed to delete post" });
  }
};
