const { Schema, model } = require("mongoose");
const SMSMessageSchema = new Schema(
  {

    message: {
      type:String,
      required:true
    },
    officer_phone: {
      type:String,
      required:true
    },
    student_phone: {
      type:String,
      required:true
    },
    type: {
      type:String,
      required:true
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isChatbot: {
      type: Boolean,
      required:true
    },
    student_id: {
      // type: String,
      type: Schema.Types.ObjectId,
      ref: 'Student',
    },
    chatBotReplyID: {
      type: Schema.Types.ObjectId,
    },
    is_read: {
      type: Boolean,
      required:true
    },
    notification: {
      type: Boolean,
    }
  }
);


module.exports = model("SMSMessage", SMSMessageSchema);
