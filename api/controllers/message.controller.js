import prisma from "../lib/prisma.js";

export const addMessage = async (req, res) => {
  const tokenUserId = req.userId;
  const chatId = req.params.chatId;
  const text = req.body.text;
  console.log(tokenUserId, chatId, text);

  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
      include: {
        users: true,
      },
    });

    if (!chat || !chat.userIDs.includes(tokenUserId)) {
      return res
        .status(404)
        .json({ message: "Chat not found or user not authorized" });
    }

    const message = await prisma.message.create({
      data: {
        text,
        chatId,
        userId: tokenUserId,
      },
    });

    await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        seenBy: {
          push: tokenUserId,
        },
        lastMessage: text,
      },
    });

    res.status(200).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add message!" });
  }
};
