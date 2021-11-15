
const passport = require("passport");
const Category = require("../models/Category");
const FAQ = require("../models/FAQ");
const Query = require("../models/Query");
require('../middlewares/passport')(passport);
const { SECRET } = require("../config");
const ObjectId = mongoose.Types.ObjectId;

//Show all Category
const ShowAllCategory = async (req, res) => {

    try {
        await Category.find(function (err, category) {
            if (err) return next(err);

            let others = category.filter(e=>e.category_name === 'others');
            let newCategory = category.filter(e=>e.category_name !== 'others');
            newCategory.push(others[0]);
         
            res.json({
                category: newCategory,
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
    let { category_name } = req;
    try {
        //Check required fields
        if (!category_name) {
            return res.status(400).json({
                message: `Please enter all fields`,
                success: false
            });
        }
        category_name = category_name.toLowerCase();
        // create a new Category
        const newCategory = new Category({
            category_name
        });

        // newCategory.officer_id = user_id;
        let checkCategory = await Category.findOne({ category_name });

        if (checkCategory) {
            return res.status(400).json({
                message: `Category Already Exist`,
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
        console.log(req)
        let category = await Category.findById(cat_id);

        if (!category) {
            return res.status(404).json({
                message: "Category not Found",
                success: false
            });
        }
        await Category.findOneAndUpdate({ _id: cat_id }, req, {
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
const DeleteCategory = async (req, cat_id, res) => {
    try {
        let category = await Category.findById(cat_id);
        if (!category) {
            return res.status(404).json({
                message: "Category not Found",
                success: false
            });
        }
        // Check if the category is Others
        if (category.category_name === "others") {
            return res.status(404).json({
                message: "Unable to delete Others Category",
                success: false
            });
        }
        // Find others category, if null then create one
        let others = await Category.findOne({category_name:"others"});
        if(!others){
            const createOthers= new Category();
            createOthers.category_name = "others";
            await createOthers.save();
        }
        //Delete category
        await Category.deleteOne({ _id: cat_id }, async function (err, data) {
            const category = data[0];
            //Delete FAQ with same category
            await FAQ.deleteMany({ category_id: ObjectId(cat_id) })
            //Update query with others and set faq_id to null
            await Query.updateMany(
                { category_id: ObjectId(cat_id)},
                { $set: { category_id: ObjectId(others._id), faq_id: null}})

        });

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