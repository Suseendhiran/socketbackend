const dotenv = require("dotenv");
var app = require("express")();
var cors = require("cors");

dotenv.config();

app.use(function (req, res, next) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "http://" + req.headers.host + ":8100"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  next();
});

var server = require("http").Server(app);

const io = require("socket.io")(server);

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
