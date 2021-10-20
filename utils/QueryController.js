
const passport = require("passport");
const Query = require("../models/Query");
const Sender = require("../models/Sender");
require('../middlewares/passport')(passport);
mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const { SECRET } = require("../config");


// //Show all Queries
const GetAllQueries = async (req, res) => {

    try {
        queries = await Query.aggregate([
            {
                "$lookup": {
                    "from": 'senders',
                    "localField": 'sender_id',
                    "foreignField": '_id',
                    "as": "sender"
                },
            },
            {
                "$unwind": {
                    "path": "$sender",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": 'students',
                    "localField": 'sender.student_id',
                    "foreignField": 'student_id',
                    "as": "student"
                }
            },
            {
                "$unwind": {
                    "path": "$student",
                    "preserveNullAndEmptyArrays": true
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

        return res.json({
            query_list: queries,
            succes: true
        });


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}

//Show Query
const ShowQuery = async (sender_id, faq_id, category_id, req, res) => {
    
    try {
        var match;
        var sender = sender_id
        if(sender === "null") {
          
            match = {
                "$match": {
                    "$and": [
                        { 'category_id': { $eq: ObjectId(category_id) } },
                        { 'faq_id': { $eq: ObjectId(faq_id) } }
                    ]
                }
            }
        }else{
        
            match = {
                "$match": {
                    "$and": [
                        { "sender_id": { $eq: ObjectId(sender_id) } },
                        { 'category_id': { $eq: ObjectId(category_id) } },
                        { 'faq_id': { $eq: ObjectId(faq_id) } }
                    ]
                }
            }
        }

        const query = await Query.aggregate([
            // {
            //     "$match": {
            //         "$and": [
            //             { "sender_id": { $eq: ObjectId(sender_id) } },
            //             { 'faq_id': { $eq: ObjectId(faq_id) } },
            //             { 'category_id': { $eq: ObjectId(category_id) } }
                        
            //         ]
            //     }
            // },
            match, 
            {
                "$lookup": {
                    "from": 'senders',
                    "localField": 'sender_id',
                    "foreignField": '_id',
                    "as": "sender"
                },
            },
            {
                "$unwind": {
                    "path": "$sender",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                "$lookup": {
                    "from": 'students',
                    "localField": 'sender.student_id',
                    "foreignField": 'student_id',
                    "as": "student"
                }
            },
            {
                "$unwind": {
                    "path": "$student",
                    "preserveNullAndEmptyArrays": true
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


        ], function(err, user){
            console.log(user);
        });


        if (!query.length) {
            return res.status(404).json({
                message: "Query not Found",
                success: false
            });
        } else {
            return res.json({
                Query: query,
                succes: true
            });
        }

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}

// Create new Student
const NewQuery = async (sender_id, faq_id, category_id, req, res) => {
    const { query_name, possible_answer, status } = req;
    // var sender = 123;
    try {
        // console.log(req)
        if (!category_id || !faq_id || !query_name || !possible_answer || !status) {
            return res.status(400).json({
                message: `Please enter all fields`,
                success: false
            });
        }
        // const newQuery = new Query();
        // if (!mongoose.Types.ObjectId.isValid(sender)) {
        //     console.log("Hello", sender)
        //     sender = null;
        // } 
        // create a new FAQ
        const newQuery = new Query({
            sender_id,
            category_id,
            faq_id,
            query_name,
            possible_answer,
            status
        });

        await newQuery.save();
        return res.status(201).json({
            message: "New Query ",
            success: true
        });


    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
};

// Edit Query
const EditQuery = async (sender_id, faq_id, category_id, req, res) => {
    try {
        let query = await Query.find({
            $and: [
                { sender_id: sender_id },
                { faq_id: faq_id },
                { category_id: category_id }
            ]
        });

        if (!query.length) {
            return res.status(404).json({
                message: "Query not Found",
                success: false
            });
        }
        await Query.findOneAndUpdate({
            sender_id: sender_id,
            faq_id: faq_id,
            category_id: category_id
        }, req, {
            new: true,
            runValidators: true,
        });

        return res.status(201).json({
            message: "Updated Successfully",
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

// // Delete Query
const DeleteQuery = async (sender_id, faq_id, category_id, req, res) => {
    try {
        let query = await Query.find({
            $and: [
                { sender_id: sender_id },
                { faq_id: faq_id },
                { category_id: category_id }
            ]
        });

        if (!query.length) {
            return res.status(404).json({
                message: "Student not Found",
                success: false
            });
        }
        await Query.remove({
            sender_id: sender_id,
            faq_id: faq_id,
            category_id: category_id
        });

        return res.status(201).json({
            message: "Deleted Successfully",
            success: true
        });

    } catch (err) {
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}


const ShowQueriesByCategory = async (req, id, res) => {

    try {
        const query = await Query.find({ category_id: ObjectId(id) });
        console.log(id);
        console.log(query);
        return res.status(201).json({
            query_list: query,
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


//Show Student

module.exports = {
    NewQuery,
    GetAllQueries,
    ShowQuery,
    EditQuery,
    DeleteQuery,
    ShowQueriesByCategory
};