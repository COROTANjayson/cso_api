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
    }
    // session_id: {
    //   type: String,
    //   // type: Schema.Types.ObjectId,
    //   // ref: 'QuerrySession',
    //   required: true
    // },
    // sender_id: {
    //   type: String,
    //   // type: Schema.Types.ObjectId,
    //   // ref: 'Sender',
    //   required: true

    // },
    // receiver_id: {
    //   type: String,
    //   // type: Schema.Types.ObjectId,
    //   // ref: 'User',
    //   required: true
    // },
    // sender_phone_number: {
    //   type: Number,
    //   required: true
    // },
    // receiver_phone_number: {
    //   type: String,
    //   required: true
    // },
    // createdAt: {
    //   type: Date,
    //   default: Date.now,
    // }
  }
);


module.exports = model("SMSMessage", SMSMessageSchema);
