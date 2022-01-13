const dotenv = require("dotenv");
var app = require("express")();
const { MongoClient } = require("mongodb");
var cors = require("cors");
const res = require("express/lib/response");

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

// creating socket
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["content-type"],
  },
});

class SocketConnection {
  constructor(io, socket, client, app) {
    this.socket = socket;
    this.io = io;
    this.app = app;
    this.client = client;
    this.utterances = [
      ["how are you", "how is life", "how are things"], //0
      ["hi", "hey", "hello", "good morning", "good afternoon"], //1
      ["what are you doing", "what is going on", "what is up"], //2
      ["how old are you"], //3
      ["who are you", "are you human", "are you bot", "are you human or bot"],
    ];
    this.answers = [
      [
        "Fine... how are you?",
        "Pretty well, how are you?",
        "Fantastic, how are you?",
      ], //0
      ["Hello!", "Hi!", "Hey!", "Hi there!", "Howdy"], //1
      [
        "Nothing much",
        "About to go to sleep",
        "Can you guess?",
        "I don't know actually",
      ], //2
      ["I am infinite"], //3
      ["I am just a bot", "I am a bot. What are you?"], //4
    ];
    this.alternatives = ["Go on...", "Try again"];

    socket.on("sendMessage", (message) => this.SendMessage(message));
    socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });
    socket.on("disconnect", (reason) => this.Disconnect(reason));
    app.get("/", (req, res) => {
      res.send({ message: "hi" });
    });
  }

  Compare(utterancesArray, answersArray, string) {
    let item;
    for (let x = 0; x < utterancesArray.length; x++) {
      for (let y = 0; y < utterancesArray[x].length; y++) {
        if (utterancesArray[x][y] === string) {
          let items = answersArray[x];
          item = items[Math.floor(Math.random() * items.length)];
        }
      }
    }
    return item;
  }

  GetBotAnswer(input) {
    let output;
    let text = input.toLowerCase().replace(/[^\w\s\d]/gi, "");
    text = text
      .replace(/ a /g, " ")
      .replace(/whats/g, "what is")
      .replace(/please /g, "")
      .replace(/ please/g, "");

    if (this.Compare(this.utterances, this.answers, text)) {
      output = this.Compare(this.utterances, this.answers, text);
    } else {
      output =
        this.alternatives[Math.floor(Math.random() * this.alternatives.length)];
    }
    return output;
  }

  async SendMessage(message) {
    console.log("inside send", message, this.GetBotAnswer(message));
    this.socket.broadcast.emit("toClients", message, this.socket.id);
    const botAnswer = this.GetBotAnswer(message);
    this.socket.emit("toClients", botAnswer, "Bot");
    this.socket.broadcast.emit("toClients", botAnswer, "Bot");
    const response = await this.client
      .db("chatbot")
      .collection("usersMessages")
      .insertOne({
        userId: this.socket.id,
        userQuestion: message,
        botAnswer: botAnswer,
      });
    //console.log("db response", response);
  }
  //Show disconnect reason
  Disconnect(reason) {
    console.log("Disconnect reason", reason);
  }
}

//console.log("sas");

//Send unique id to clients whenever new client connects

//Mongo connection
async function createMongoConnection() {
  const client = new MongoClient(process.env.MONGO_URL);
  await client.connect(() => {
    console.log("Mongodb connected");
    io.on("connection", (socket) => {
      new SocketConnection(io, socket, client, app);
    });
  });
}

createMongoConnection();
