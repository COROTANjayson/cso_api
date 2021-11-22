const { Schema, model } = require("mongoose");

const SystemLogSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            required: true
        },
        date: {
            type: Date,
            default: Date.now,
        }
    }
);


module.exports = model("SystemLog",  SystemLogSchema);
