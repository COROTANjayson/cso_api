const passport = require("passport");
const FAQ = require("../models/FAQ");
const Category = require("../models/Category");
const Query = require("../models/Query");
mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { NlpManager } = require('node-nlp');

require('../middlewares/passport')(passport);
//Show all FAQ
const ShowAllFAQ = async (req, res) => {
    try {

        let faq = await FAQ.aggregate([
            {
                "$lookup": {
                    "from": 'categories',
                    "localField": 'category_id',
                    "foreignField": '_id',
                    "as": "category"
                }
            },
            { "$unwind": "$category" },

        ]);

        return res.json({
            FAQ_list: faq,
            succes: true
        });
    } catch (error) {
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Unable to show FAQ",
            success: false
        });
    }
}

//Show FAQ
const ShowFAQ = async (req, faq_id, res) => {

    try {
        let faq = await FAQ.aggregate([
            { "$match": { "_id": ObjectId(`${faq_id}`) } },
            {

                "$lookup": {
                    "from": 'categories',
                    "localField": 'category_id',
                    "foreignField": '_id',
                    "as": "category"
                }
            },
            { "$unwind": "$category" },

        ]);

        if (!faq.length) {
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
        console.log(err);
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}

// Create new FAQ
const AddFAQ = async (req, user_id, res) => {

    try {
        const { faq_title, faq_answer, faq_utterances, category_id } = req;
        // Check required fields
        if (!faq_title || !faq_answer || !faq_utterances) {
            return res.status(400).json({
                message: `Please enter all fields`,
                success: false
            });
        }

        // Check Cateegory if it exist
        let checkCategory = await Category.findById(category_id);
        if (!checkCategory) {
            return res.status(404).json({
                message: "The category does not exist",
                success: false
            });
        }
        // create a new FAQ
        const newFAQ = new FAQ({
            faq_title, faq_answer, faq_utterances, category_id
        });

        const newAddedFAQ = await newFAQ.save();

        // //Scan the Query collection
        ScanQuery(faq_utterances, faq_title, faq_answer, newAddedFAQ._id, category_id)

        return res.status(201).json({
            message: "Added new FAQ ",
            success: true
        });
    } catch (err) {
        // Implement logger function (winston)
        console.log(err)
        return res.status(500).json({
            message: "Server Error",
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
        await FAQ.findOneAndUpdate({ _id: faq_id }, req, {
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

// Delete FAQ
const DeleteFAQ = async (req, faq_id, res) => {
    try {
        let faq = await FAQ.findById(faq_id);

        if (!faq) {
            return res.status(404).json({
                message: "FAQ not Found",
                success: false
            });
        }

        let others = await Category.findOne({ category_name: "others" });
        await Query.updateMany(
            { faq_id: ObjectId(faq_id) },
            { $set: { category_id: ObjectId(others._id), faq_id: null } }
        )

        faq = await FAQ.deleteOne({ _id: faq_id });

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

const ShowFAQByCategory = async (req, res) => {

    try {


        const { category_id } = req

        let objectid = new Array();
        category_id.forEach(e => {
            objectid.push(ObjectId(e))
        });

        const lookup_category = [{
            "$lookup": {
                "from": 'categories',
                "localField": 'category_id',
                "foreignField": '_id',
                "as": "category"
            }
        },
        {
            "$unwind": {
                "path": "$category",
                "preserveNullAndEmptyArrays": true
            }
        },]

        let faq
        if (!category_id.length) {
            faq = await FAQ.aggregate([
                ...lookup_category

            ]);
        } else {
            faq = await FAQ.aggregate([
                { "$match": { "category_id": { "$in": [...objectid] } } },
                ...lookup_category

            ]);
        }

        return res.status(201).json({
            faq_list: faq,
            success: true
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}


const ScanQuery = async (faq_utterances, faq_title, faq_answer, faq_id, category_id) => {
    const manager = new NlpManager({ languages: ['en'], forceNER: true });

    // Get the "Others" Category
    let category = await Category.findOne({ _id: category_id });
    
    console.log(category.category_name)
    // Get query with a category of others or faq_id is null
    let queries = await Query.aggregate([
        {
            "$match": {
                "$or": [
                    // { "category_id": ObjectId(others._id) },
                    { "faq_id": null }
                ]
            }
        },
        {
            "$lookup": {
                "from": 'categories',
                "localField": 'category_id',
                "foreignField": '_id',
                "as": "category"
            }
        },
        { "$unwind": "$category" },
    ]);

    // Identify possible queries base on category of the new added faq
    const possible_query = await IdentifyPossibleQueries(queries, category.category_name)

    const faq = await FAQ.find({ category_id: category_id });

    faq.forEach(element => {
        element.faq_utterances.forEach(e=>{
            manager.addDocument('en', e.value, element.faq_title);

        })
        manager.addAnswer('en', element.faq_title, element.faq_answer);
    });

    await manager.train();
    manager.save();

    // console.log(possible_query)
    possible_query.forEach(async query => {
        const response = await manager.process('en', query.query_name);
        // console.log(response.answer, faq_answer)
        // console.log(faq_answer)
        if (response.answer === faq_answer) {
            // console.log(query._id)

            //Update query
            await Query.updateMany(
                { _id: ObjectId(query._id) },
                { $set: { category_id: ObjectId(category_id), faq_id: ObjectId(faq_id), possible_answer: faq_answer } }
            )
        }
    })
}


const IdentifyPossibleQueries = async (queries, category_name) => {

    const manager = new NlpManager({ languages: ['en'], forceNER: true });
   
    // console.log(queries)
    const category = await Category.find()

    manager.addDocument('en', category_name, category_name);
    manager.addAnswer('en', category_name, category_name);

    await manager.train();
    manager.save();


    let possible_query = []
    
    await Promise.all(queries.map(async function (query) {
        const response = await manager.process('en', query.query_name);

        if (response.intent !== 'None') {
            possible_query.push(query)
        }

    }))
    // console.log(possible_query)
    return possible_query;

}

module.exports = {
    AddFAQ,
    ShowAllFAQ,
    ShowFAQ,
    EditFAQ,
    DeleteFAQ,
    ShowFAQByCategory
};