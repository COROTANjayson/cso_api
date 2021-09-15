const { Schema, model } = require("mongoose");

const StudentSchema = new Schema(
    {
        student_id: {
            type: String,
            required: true
        },
        sender_number: {
            type: Number,
            required: true
        },
        first_name: {
            type: String,
            required: true
        },
        last_name: {
            type: String,
            required: true
        },
        phone_number: {
            type: Number,
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
        school: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now,
        }
    }
);


module.exports = model("Student",  StudentSchema);
