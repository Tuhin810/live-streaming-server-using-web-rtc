const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this for security in production
  },
});

const rooms = {}; // Store users in rooms

io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);

    // Notify existing users
    socket.to(roomId).emit("user-joined", socket.id);

    // Send existing users to the new user
    socket.emit(
      "all-users",
      rooms[roomId].filter((id) => id !== socket.id)
    );
  });

  socket.on("signal", (data) => {
    io.to(data.to).emit("signal", { from: socket.id, signal: data.signal });
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      socket.to(roomId).emit("user-left", socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    }
    console.log("User disconnected: ", socket.id);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
