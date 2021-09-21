const { Schema, model } = require("mongoose");

const NotificationSchema = new Schema(
    {
        category_name: {
            type: String,
            required: true
        },
        officer_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        student_id: {
            type: Schema.Types.ObjectId,
            ref: 'Student',
        }
    }
);


module.exports = model("Notification",  NotificationSchema);
