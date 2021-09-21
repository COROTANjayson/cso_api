const { Schema, model } = require("mongoose");

const SenderSchema = new Schema(
    {
        student_id: {
            type: Schema.Types.ObjectId,
            ref: 'Student',
        },
        sender_phone_number: {
            type: Number,
            required: true
        }
    }
);


module.exports = model("Sender",  SenderSchema);
