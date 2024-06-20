import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: "http://localhost:5173",
  },
});

let onlineUsers = [];

const addUser = (userId, socketId) => {
  const userExists = onlineUsers.find((user) => user.userId === userId);
  if (!userExists) {
    onlineUsers.push({ userId, socketId });
  }
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

    socket.on("newUser", (userId) => {
    console.log("New user:", userId);
    console.log("socket id",socket.id);
    addUser(userId, socket.id);
  
    console.log(onlineUsers); 
    // 6667d96331bfc9e886cf9cec
    io.emit("updateUserList", onlineUsers); // Emit updated user list to all clients
  });

  socket.on("sendMessage", ({ receiverId, data }) => {
    console.log("Message received for:", receiverId, data);
    console.log("receiverId",receiverId);
    const user = getUser(receiverId);
    console.log("user in socket",user,data);

    if (user) {
      
      io.to(user.socketId).emit("getMessage", data); // Send message to the specific user
    }
  });

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    removeUser(socket.id);
    io.emit("updateUserList", onlineUsers); // Emit updated user list to all clients
  });
});

io.listen(4000, () => {
  console.log("Socket.io server is listening on port 4000");
});
