const { Schema, model } = require("mongoose");
const QuerySchema = new Schema(
  {
    sender_id: {
      // type: String,
      type: Schema.Types.ObjectId,
      // ref: 'Student',
    },
    category_id: {
      // type: String,
      type: Schema.Types.ObjectId,
      // ref: 'Category',
      required: true
    },
    faq_id: {
      // type: String,
      type: Schema.Types.ObjectId,
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
    phone_num: {
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
