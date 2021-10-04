const { Schema, model } = require("mongoose");

const CategorySchema = new Schema(
    {
        category_name: {
            type: String,
            required: true
        },
        // officer_id: {
        //     type: Schema.Types.ObjectId,
        //     ref: 'User',
        // },
        createdAt: {
            type: Date,
            default: Date.now,
        }
    }
);


module.exports = model("Category",  CategorySchema);
