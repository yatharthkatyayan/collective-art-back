const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const cors = require("cors");

const router = require("./router");

const { addUser, removeUser, getUser, getUsersInRoom } = require("./user");

const app = express();
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: "*",
  },
});

app.use(router);
app.use(cors);
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`server listening on : ${PORT}`);

  io.on("connection", (socket) => {
    console.log("new user has connected !!!");

    socket.on("join", ({ name, room }, callback) => {
      const { error, user } = addUser({ id: socket.id, name, room });

      if (error) return callback(error);

      socket.join(user.room);

      socket.emit("message", {
        user: "Admin",
        text: `${user.name}, welcome to room ${user.room}.`,
      });

      socket.broadcast
        .to(user.room)
        .emit("message", { user: "Admin", text: `${user.name} has joined!` });

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });

      callback();
    });

    socket.on("sendMessage", (message, callback) => {
      const user = getUser(socket.id);

      io.to(user.room).emit("message", { user: user.name, text: message });

      callback();
    });

    socket.on("sendImage", (message, callback) => {
      const user = getUser(socket.id);

      io.to(user.room).emit("Image", { user: user.name, text: message });

      callback();
    });

    socket.on("disconnect", () => {
      const user = removeUser(socket.id);

      if (user) {
        io.to(user.room).emit("message", {
          user: "Admin",
          text: `${user.name} has left.`,
        });
        io.to(user.room).emit("roomData", {
          room: user.room,
          users: getUsersInRoom(user.room),
        });
      }
    });
  });
});
