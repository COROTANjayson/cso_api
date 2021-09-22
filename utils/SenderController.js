const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const Sender = require("../models/Sender");
const dotenv = require('dotenv')
require('../middlewares/passport')(passport);
const { SECRET } = require("../config");


// Create new Sender
const AddSender = async (req,  res) => {
    const { student_id, sender_phone_number } = req;

    try {
        //Check required fields
        if (!student_id || !sender_phone_number) {
            return res.status(400).json({
                message: `Please enter all fields`,
                success: false
            });
        }
        // create a new Sender
        const newSender = new Sender({
            student_id, sender_phone_number
        });

        await newSender.save();
        return res.status(201).json({
            message: "New Sender",
            success: true
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
};



module.exports = {
    AddSender
};