const { Schema, model } = require("mongoose");
const FAQSchema = new Schema(
  {
    faq_title: {
      type: String,
      required: true
    },
    faq_answer: {
      type: String,
      required: true
    },
    category_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    faq_utterances: {
      type: Array,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    deletedAt: {
      type: Date
    },
  }
);


module.exports = model("FAQ", FAQSchema);
