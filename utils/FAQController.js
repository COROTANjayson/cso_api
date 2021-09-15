const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const FAQ = require("../models/FAQ");
const dotenv = require('dotenv')
require('../middlewares/passport')(passport);
const { SECRET } = require("../config");


//Show all FAQ
const ShowAllFAQ = async (req, res) => {

    try {
        await FAQ.find(function (err, faq) {
            if (err) return next(err);
            res.json({
                FAQ_list: faq,
                succes: true
            });

        });
    } catch (error) {
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Unable to add new FAQ",
            success: false
        });
    }
}

//Show FAQ
const ShowFAQ = async (req, faq_id, res) => {

    try {
        let faq = await FAQ.findById(faq_id);

        // await FAQ.find(function (err, faq) {
        if (!faq) {
            return res.status(404).json({
                message: "FAQ not Found",
                success: false
            });
        } else {
            return res.json({
                FAQ: faq,
                succes: true
            });
        }

        // });


    } catch (err) {
        console.error(err)
        res.render('error/404')
    }
}

// Create new FAQ
const AddFAQ = async (req, user_id, res) => {
    const { faq_title, faq_answer } = req;
    try {
        // console.log(user_id)
        //Check required fields
        if (!faq_title || !faq_answer) {
            return res.status(400).json({
                message: `Please enter all fields`,
                success: false
            });
        }
        // create a new FAQ
        const newFAQ = new FAQ({
            faq_title, faq_answer
        });

        newFAQ.officer_id = user_id;

        await newFAQ.save();
        return res.status(201).json({
            message: "Added new FAQ ",
            success: true
        });
    } catch (err) {
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Unable to add new FAQ",
            success: false
        });
    }
};

// Edit FAQ
const EditFAQ = async (req, faq_id, res) => {
    try {
        let faq = await FAQ.findById(faq_id);

        if (!faq) {
            return res.status(404).json({
                message: "FAQ not Found",
                success: false
            });
        }
        faq = await FAQ.findOneAndUpdate({ _id: faq_id }, req, {
            new: true,
            runValidators: true,
        });

        return res.status(201).json({
            message: "Updated Successfully",
            success: true
        });

    } catch (err) {
        return res.status(500).json({
            message: "Cannot update FAQ",
            success: false
        });
    }
}

// Delete FAQ
const DeleteFAQ =  async (req, faq_id, res) => {
    console.log(req)
    try {
        let faq = await FAQ.findById(faq_id);

        if (!faq) {
            return res.status(404).json({
                message: "FAQ not Found",
                success: false
            });
        }
        faq = await FAQ.remove({ _id: faq_id });

        return res.status(201).json({
            message: "Deleted Successfully",
            success: true
        });

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Cannot delete FAQ",
            success: false
        });
    }
}

module.exports = {
    AddFAQ,
    ShowAllFAQ,
    ShowFAQ,
    EditFAQ,
    DeleteFAQ
};