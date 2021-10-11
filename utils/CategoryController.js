const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const Category = require("../models/Category");
const dotenv = require('dotenv')
require('../middlewares/passport')(passport);
const { SECRET } = require("../config");


//Show all Category
const ShowAllCategory = async (req, res) => {

    try {
        await Category.find(function (err, category) {
            if (err) return next(err);
            res.json({
                category: category,
                succes: true
            });

        });
    } catch (error) {
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}

//Show Category
const ShowCategory = async (req, cat_id, res) => {

    try {
        let category = await Category.findById(cat_id);

        // await FAQ.find(function (err, faq) {
        if (!category) {
            return res.status(404).json({
                message: "category not Found",
                success: false
            });
        } else {
            return res.json({
                category: category,
                succes: true
            });
        }

        // });


    } catch (err) {
        res.status(500).json({
            message: "Server Error",
            success: false
        })
    }
}

// Create new FAQ
const AddCategory = async (req, user_id, res) => {
    const { category_name } = req;
    try {
        //Check required fields
        if (!category_name) {
            return res.status(400).json({
                message: `Please enter all fields`,
                success: false
            });
        }
        // create a new Category
        const newCategory = new Category({
            category_name
        });

        // newCategory.officer_id = user_id;
        let checkCategory = await Category.findOne({ category_name });

        if (checkCategory) {
            return res.status(400).json({
                message: `New Category is added`,
                success: false
            });
        }
        await newCategory.save();
        return res.status(201).json({
            message: "Added new Category ",
            success: true
        });
    } catch (err) {
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
};

// Edit Category
const EditCategory = async (req, cat_id, res) => {
    try {
        let category = await Category.findById(cat_id);

        if (!category) {
            return res.status(404).json({
                message: "Category not Found",
                success: false
            });
        }
        faq = await Category.findOneAndUpdate({ _id: cat_id }, req, {
            new: true,
            runValidators: true,
        });

        return res.status(201).json({
            message: "Updated Successfully",
            success: true
        });

    } catch (err) {
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}

// Delete Category
const DeleteCategory =  async (req, cat_id, res) => {
    console.log(req)
    try {
        let cate = await Category.findById(cat_id);

        if (!cate) {
            return res.status(404).json({
                message: "Category not Found",
                success: false
            });
        }
        cate = await Category.remove({ _id: cat_id });

        return res.status(201).json({
            message: "Deleted Successfully",
            success: true
        });

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}

module.exports = {
    AddCategory,
    ShowAllCategory,
    ShowCategory,
    EditCategory,
    DeleteCategory
};