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
    officer_id: {
    type: String,
    required: true
    },
    officer_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
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
