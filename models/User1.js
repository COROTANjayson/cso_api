const { Schema, model } = require("mongoose");
const UserSchema = new Schema(
  {
    first_name: {
      type: String,
      required: true
    },
    last_name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone_num: {
      type: String,
      required: true
    },
    gender: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    position: {
      type: String,
      required: true
    },
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    user_role: {
      type: String,
      required:true
    },
  },
  { timestamps: true }
);


module.exports = model("users", UserSchema);
