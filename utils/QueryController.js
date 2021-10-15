
const passport = require("passport");
const Query = require("../models/Query");
const Sender = require("../models/Sender");
require('../middlewares/passport')(passport);
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
            { "$unwind": "$sender" },
            {
                "$lookup": {
                    "from": 'students',
                    "localField": 'sender.student_id',
                    "foreignField": 'student_id',
                    "as": "student"
                }
            },
            { "$unwind": "$student" },
            // {
            //     "$lookup": {
            //         "from": 'categories',
            //         "localField": 'category_id',
            //         "foreignField": '_id',
            //         "as": "category"
            //     }
            // },
            // { "$unwind": "$category" },
            
        ]); 
        
        console.log(queries);
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
const ShowQuery = async (sender_id, session_id, category_id, req, res) => {

    try {
        let query = await Query.find({
            $and: [
                { sender_id: sender_id },
                { session_id: session_id },
                { category_id: category_id }
            ]
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
        console.error(err)
        res.render('error/404')
    }
}

// Create new Student
const NewQuery = async (sender_id, session_id, category_id, req, res) => {
    const { query_name, possible_answer, status } = req;

    try {
        console.log(req)
        if (!sender_id || !session_id || !category_id || !query_name || !possible_answer || !status) {
            return res.status(400).json({
                message: `Please enter all fields`,
                success: false
            });
        }
        // create a new FAQ
        const newQuery = new Query({
            sender_id,
            session_id,
            category_id,
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
const EditQuery = async (sender_id, session_id, category_id, req, res) => {
    try {
        let query = await Query.find({
            $and: [
                { sender_id: sender_id },
                { session_id: session_id },
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
            session_id: session_id,
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
const DeleteQuery = async (sender_id, session_id, category_id, req, res) => {
    try {
        let query = await Query.find({
            $and: [
                { sender_id: sender_id },
                { session_id: session_id },
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
            session_id: session_id,
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

//Show Student

module.exports = {
    NewQuery,
    GetAllQueries,
    ShowQuery,
    EditQuery,
    DeleteQuery,
};