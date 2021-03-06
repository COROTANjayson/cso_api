const cors = require("cors");
const express = require("express");
// const bp = require("body-parser");
const passport = require("passport");
const { connect } = require("mongoose");
const { success, error } = require("consola");
const http = require('http');


// Bring in the app constants
const { DB, PORT } = require("./config");

// Initialize the application
const app = express();

// Socket io
const socketio = require('socket.io');

// Initialize and Connect to socket.io
const server = http.createServer(app);
const io = socketio(server);


// Middlewares
// app.use(cors());
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(passport.initialize());

/* require("./middlewares/passport")(passport); */

// User Router Middleware
app.use("/api/users", require("./routes/users"));
app.use("/api/FAQ", require("./routes/FAQ"));
app.use("/api/students", require("./routes/students"));
app.use("/api/query", require("./routes/query"));
app.use("/api/sender", require("./routes/sender"));
app.use("/api/category", require("./routes/category"));
app.use('/api/sms', require('./routes/sms')(io));
// Testing router (can be deleted)
app.use('/api/nlp',require('./routes/nlp'))


const startApp = async () => {
  try {
    // Connection With DB
    await connect(DB, {
      useFindAndModify: false,
      useUnifiedTopology: true,
      useNewUrlParser: true
    });

    success({
      message: `Successfully connected with the Database \n${DB}`,
      badge: true
    });

    // Start Listenting for the server on PORT
    server.listen(PORT, () =>
      success({ message: `Server started on PORT ${PORT}`, badge: true })
    );

  } catch (err) {
    error({
      message: `Unable to connect with Database \n${err}`,
      badge: true
    });
    startApp();
  }
};

startApp();
