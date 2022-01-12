const dotenv = require("dotenv");
var app = require("express")();
var cors = require("cors");

dotenv.config();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});

var server = require("http").createServer(app);

server.listen(process.env.PORT, () => {
  console.log("PORT connected", process.env.PORT);
});

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["content-type"],
    pingTimeout: 7000,
    pingInterval: 3000,
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
