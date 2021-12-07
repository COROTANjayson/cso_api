const { Schema, model } = require("mongoose");

const StudentSchema = new Schema(
    {
        first_name: {
            type: String,
            required: true
        },
        last_name: {
            type: String,
            required: true
        },
        phone_number: {
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
       
    }
);


module.exports = model("Student",  StudentSchema);
