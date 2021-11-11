const { Schema, model } = require("mongoose");

const StudentSchema = new Schema(
    {
        student_id: {
            type: String,
            required: true
        },
        email: {
            type: String,
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
        middle_name: {
            type:String,
            required: true
        },
        phone_number: {
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
        school: {
            type: String,
            required: true
        },
        course: {
            type: String,
            required: true
        },
        year: {
            type: String,
            required: true
        }
    }
);


module.exports = model("Student",  StudentSchema);
