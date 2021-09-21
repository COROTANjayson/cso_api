const { Schema, model } = require("mongoose");
const QuerySessionSchema = new Schema(
  {
    title: {
      type: String,
      required: true

    },
    status: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
        type: Date
      }
  }
);


module.exports = model("QuerySession", QuerySessionSchema);
