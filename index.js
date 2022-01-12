const dotenv = require("dotenv");

dotenv.config();

const io = require("socket.io")(process.env.PORT, {
  cors: {
    origin: ["http://localhost:3000"],
  },
});

class SocketConnection {
  constructor(io, socket) {
    this.socket = socket;
    this.io = io;

    socket.on("sendMessage", (message) => this.SendMessage(message));
    socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });
  }
  SendMessage(message) {
    console.log("inside send", message);
    this.socket.broadcast.emit("toClients", message);
  }
}

//console.log("sas");

//Send unique id to clients whenever new client connects

io.on("connection", (socket) => {
  console.log("id", socket.id);
  new SocketConnection(io, socket);
});
