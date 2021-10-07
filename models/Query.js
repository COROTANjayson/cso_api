const { Schema, model } = require("mongoose");
const QuerySchema = new Schema(
  {
    sender_id: {
      // type: String,
      type: Schema.Types.ObjectId,
      ref: 'Sender',
      required: true
    },
    session_id: {
      type: String,
      // type: Schema.Types.ObjectId,
      // ref: 'Session',
      required: true

    },
    category_id: {
      // type: String,
      type: Schema.Types.ObjectId,
      // ref: 'Category',
      required: true
    },
    query_name: {
      type: String,
      required: true
    },
    possible_answer: {
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
    }
  }
);


module.exports = model("Query", QuerySchema);
