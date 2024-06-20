import prisma from "../lib/prisma.js";

export const getChats = async (req, res) => {
  const tokenUserId = req.userId;
  let retries = 3;
  while (retries) {
    try {
      const chats = await prisma.chat.findMany({
        where: {
          userIDs: {
            hasSome: [tokenUserId],
          },
        },
      });

      for (const chat of chats) {
        const receiverId = chat.userIDs.find((id) => id !== tokenUserId);
        const receiver = await prisma.user.findUnique({
          where: {
            id: receiverId,
          },
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        });
        chat.receiver = receiver;
      }

      return res.status(200).json(chats);
    } catch (error) {
      if (retries === 1) {
        console.error("Error fetching chats:", error);
        return res.status(500).json({
          message: "Failed to get chats",
          error: error.message,
        });
      }
      retries -= 1;
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
    }
  }
};


export const getChat = async (req, res) => {
  const tokenUserId = req.userId;
  const chatId = req.params.id;

  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
      include: {
        users: true,
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!chat || !chat.userIDs.includes(tokenUserId)) {
      return res.status(404).json({
        message: "Chat not found or user not authorized",
      });
    }

    await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        seenBy: {
          push: tokenUserId,
        },
      },
    });

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json({
      message: "Failed to get chat",
      error: error.message,
    });
  }
};

export const addChat = async (req, res) => {
  const tokenUserId = req.userId;
  const { receiverId } = req.body;

  if (!receiverId) {
    return res.status(400).json({
      message: "Receiver ID is required",
    });
  }

  try {
    const newChat = await prisma.chat.create({
      data: {
        userIDs: [tokenUserId, receiverId],
      },
    });
    res.status(200).json(newChat);
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({
      message: "Failed to add chat",
      error: error.message,
    });
  }
};

export const readChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chat = await prisma.chat.update({
      where: {
        id: req.params.id,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      data: {
        seenBy: {
          set: [tokenUserId],
        },
      },
    });
    res.status(200).json(chat);
  } catch (error) {
    console.error("Error reading chat:", error);
    res.status(500).json({
      message: "Failed to read chat",
      error: error.message,
    });
  }
};
