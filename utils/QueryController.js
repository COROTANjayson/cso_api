
const passport = require("passport");
const Query = require("../models/Query");
const FAQ = require("../models/FAQ");
const SMSMessage = require("../models/SMSMessage");
const Category = require('../models/Category')
require('../middlewares/passport')(passport);
mongoose = require("mongoose");

const ObjectId = mongoose.Types.ObjectId;
const { SECRET } = require("../config");
const { NlpManager } = require('node-nlp');
const { DateTime } = require("luxon");


const querydetails = [
    {
        "$lookup": {
            "from": 'students',
            "localField": 'sender_id',
            "foreignField": '_id',
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
    {
        "$lookup": {
            "from": 'faqs',
            "localField": 'faq_id',
            "foreignField": '_id',
            "as": "faq"
        }
    },
    {
        "$unwind": {
            "path": "$faq",
            "preserveNullAndEmptyArrays": true
        }
    },
]

// //Show all Queries
const GetAllQueries = async (req, res) => {

    try {
        queries = await Query.aggregate([
            { "$match": { 'phone_num': { $nin: [' ', null, '8080', 'AutoloadMax', 'TM', '4438'] } } },
            ...querydetails
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
const ShowQuery = async (query_id, req, res) => {
    try {
        const query = await Query.aggregate([
            { "$match": { "_id": ObjectId(query_id) } },
            { "$match": { 'phone_number': { $nin: [' ', null, '8080', 'AutoLoadMax', 'TM', '4438'] } } },
            ...querydetails
        ]);
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
const NewQuery = async (req, res) => {
    const { sender_id, faq_id, category_id, query_name, possible_answer, status, phone_num } = req;

    try {
        if (!category_id || !query_name || !possible_answer || !status || !phone_num) {
            return res.status(400).json({
                message: `Please enter all fields`,
                success: false
            });
        }
        const newQuery = new Query({
            category_id,
            query_name,
            possible_answer,
            status,
            phone_num
        });

        if (sender_id) {
            newQuery.sender_id = sender_id;
        }

        if (faq_id) {
            newQuery.faq_id = ObjectId(faq_id);
        }

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
const EditQuery = async (query_id, req, res) => {
    try {
        let query = await Query.findById(query_id);

        if (!query) {
            return res.status(404).json({
                message: "Query not Found",
                success: false
            });
        }
        await Query.findOneAndUpdate({ _id: query_id }, req, {
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
const DeleteQuery = async (query_id, req, res) => {
    try {
        let query = await Query.findById(query_id);

        if (!query) {
            return res.status(404).json({
                message: "Student not Found",
                success: false
            });
        }
        await Query.remove({ _id: query_id });

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
        // const query = await Query.find({ category_id: ObjectId(id) });
        const query = await Query.aggregate([
            {
                "$match": {
                    'phone_num': {
                        $nin: [' ', null, '8080', 'AutoloadMax', 'TM', '4438']
                    },
                    'category_id': ObjectId(id),
                }
            },
            ...querydetails

        ]);

        if (!query) {
            return res.status(404).json({
                message: "Category not Found",
                success: false
            });
        }

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

const ShowUnidentifiedQuery = async (req, res) => {

    try {
        const others = await Category.findOne({ category_name: 'others' });
        const query = await Query.aggregate([
            {
                "$match": {
                    'phone_num': {
                        $nin: [' ', null, '8080', 'AutoloadMax', 'TM', '4438']
                    },
                    'category_id': others._id,
                },
            },
            { $sort: { _id: -1 } },
            ...querydetails

        ]);

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

const ShowPossibleCategory = async (req, res) => {
    const manager = new NlpManager({ languages: ['en'], forceNER: true });
    sw = require('stopword')


    try {
        
        const others = await Category.findOne({ category_name: 'others' });
        queries = await Query.aggregate([
            {
                "$match": {
                    'category_id': ObjectId(others._id),
                    'phone_num': { $nin: [' ', null, '8080', 'AutoloadMax', 'TM', '4438'] },
                },
            },
            ...querydetails

        ]);

        console.log(queries.length)
        
        const category = await Category.find()

        category.forEach(element => {
            manager.addDocument('en', element.category_name, element.category_name);
            manager.addAnswer('en', element.categoryname, element.category_name);
        });

      

        await manager.train();
        manager.save();

        console.log(queries.length)
        

        await Promise.all(queries.map(async function (query) {
            let string
            let key_word
            string = query.query_name.toString().split(' ')
            key_word = sw.removeStopwords(string)
            // //const response = await manager.process('en', sw.removeStopwords(string).join(" "));
            const response = await manager.process('en', query.query_name);

            let answer = []
            await response.classifications.forEach((item) => {

                score = item.score
                if (item.score > 0) {
                    answer.push(item.intent)
                }

            })

            query.intent = answer
            query.key_words = key_word

            return query
        }))
        
        const queries2 = queries.filter(e=>e.category.category_name === 'others');

        return res.status(201).json({
            query_list: queries2.reverse(),
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

// ChangeCategory
const ChangeQueryCategory = async (query_id, req, res) => {
    try {
        const { category_name } = req;

        const query = await Query.findOne(ObjectId(query_id));

        console.log(req);

        if (!category_name) {
            return res.status(404).json({
                message: "The Category does not exist in database",
                success: false
            });
        }

        const category = await Category.findOne({ category_name: category_name.toLowerCase() });

        if (!category) {
            console.log('here it is')
            return res.status(404).json({
                message: "The Category does not exist in database",
                success: false
            });
        }
        if (!query) {
            return res.status(404).json({
                message: "Query not Found",
                success: false
            });
        }
        await Query.findOneAndUpdate({ _id: query_id }, { $set: { category_id: ObjectId(category._id) } })

        // if(!query.category_id.equals( others._id)){
        //     return res.status(404).json({
        //         message: "Category id did not match",
        //         success: false
        //     });
        // }


        return res.status(201).json({
            message: "The query's category was changed",
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

const ShowUnidentifiedQueryByMonth = async (req, res) => {

    try {
        const manager = new NlpManager({ languages: ['en'], forceNER: true });
        const { month } = req;

        const others = await Category.findOne({ category_name: 'others' });
        const queries = await Query.aggregate([
            {
                "$match": {
                    'phone_num': {
                        $nin: [' ', null, '8080', 'AutoloadMax', 'TM', '4438']
                    },
                    'category_id': others._id,
                },
            },
            { $sort: { _id: -1 } },
            { "$match": { "$expr": { "$eq": [{ "$month": '$createdAt' }, parseInt(month)] } } },

            ...querydetails

        ]);

        const query_result = await IdentifyPossibleCategory(queries, 0)

        // console.log(query_result)
        return res.status(201).json({
            query_list: query_result,
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

const GetCurrentUnidentifiedQuery = async (req, res) => {

    try {
        
        const { category_name, date } = req;

        const currentdate = new Date();
        const currentYear = currentdate.getFullYear();
        const today = currentdate.getDate();
        const currentMonth = currentdate.getMonth() + 1;
        const currentWeek = DateTime.now().weekNumber


        const current = parseInt(date)
        // console.log(currentYear);
        // console.log(today);
        // console.log(currentMonth);
        console.log("This is week", currentWeek);

        let matchDate
        // 1 - year
        // 2 - month
        // 3 - week
        // 4 - day
        if (current === 1) {
            matchDate = [
                { "$eq": [{ "$year": '$createdAt' }, currentYear] },
            ]
        } else if (current === 2) {
            matchDate = [
                { "$eq": [{ "$month": '$createdAt' }, currentMonth] },
                { "$eq": [{ "$year": '$createdAt' }, currentYear] },
            ]
        } else if (current === 3) {
            console.log('-------------- 3')
            matchDate = [
                { "$eq": [{ "$month": '$createdAt' }, currentMonth] },
                { "$eq": [{ "$year": '$createdAt' }, currentYear] },
                { "$eq": [{ "$week": '$createdAt' }, currentWeek] }
            ]
        } else if (current === 4) {
            matchDate = [
                { "$eq": [{ "$month": '$createdAt' }, currentMonth] },
                { "$eq": [{ "$year": '$createdAt' }, currentYear] },
                { "$eq": [{ "$dayOfMonth": '$createdAt' }, today] },
            ]
        } else {
            matchDate = []
        }


        const category = await Category.findOne({ category_name: "others" });

        const queries = await Query.aggregate([
            {
                "$match": {
                    'phone_num': {
                        $nin: [' ', null, '8080', 'AutoloadMax', 'TM', '4438']
                    },
                    'category_id': category._id,
                    // ...matchCategory
                },
            },
            {
                "$match": {
                    "$expr": {
                        "$and": [
                            ...matchDate
                        
                        ]

                    }
                },
            },
            { $sort: { _id: -1 } },
            ...querydetails

        ]);

        console.log('Length of Queries');
        console.log(queries.length);

        const queryWithCategory = await IdentifyPossibleCategory(queries, 1)

        let finalQuery = queryWithCategory

        if (category_name !== "all") {
            finalQuery = queryWithCategory.filter(function (query) {
                return query.possible_category === category_name;
            })
        }

        return res.status(201).json({
            query_list: finalQuery,
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

const GetCurrentQuery = async (req, res) => {

    try {
        
        const { category_name, date } = req;

        const currentdate = new Date();
        const currentYear = currentdate.getFullYear();
        const today = currentdate.getDate();
        const currentMonth = currentdate.getMonth() + 1;
        const currentWeek = DateTime.now().weekNumber
        
        const current = parseInt(date)
        console.log("This is week", currentWeek);

        //define a date object variable that will take the current system date  
       todaydate = new Date();  

        let matchDate
        // 1 - year
        // 2 - month
        // 3 - week
        // 4 - day
        if (current === 1) {
            matchDate = [
                { "$eq": [{ "$year": '$createdAt' }, currentYear] },
            ]
        } else if (current === 2) {
            matchDate = [
                { "$eq": [{ "$month": '$createdAt' }, currentMonth] },
                { "$eq": [{ "$year": '$createdAt' }, currentYear] },
            ]
        } else if (current === 3) {
            console.log('-------------- 3')
            matchDate = [
                { "$eq": [{ "$month": '$createdAt' }, currentMonth] },
                { "$eq": [{ "$year": '$createdAt' }, currentYear] },
                { "$eq": [{ "$week": '$createdAt' }, currentWeek] }
            ]
        } else if (current === 4) {
            matchDate = [
                { "$eq": [{ "$month": '$createdAt' }, currentMonth] },
                { "$eq": [{ "$year": '$createdAt' }, currentYear] },
                { "$eq": [{ "$dayOfMonth": '$createdAt' }, today] },
            ]
        } else {
            matchDate = []
        }


        const category = await Category.findOne({ category_name: "others" });
        
        const queries = await Query.aggregate([
            {
                "$match": {
                    'phone_num': {
                        $nin: [' ', null, '8080', 'AutoloadMax', 'TM', '4438']
                    },
                    // 'category_id': category._id,
                    $expr: {$ne: ['category_id', category._id]}
                    // ...matchCategory
                },
            },
            {
                "$match": {
                    // 'category_id': category._id,
                    "category_id": { "$ne": category._id } 
                    // ...matchCategory
                }
            },
            {
                "$match": {
                    "$expr": {
                        "$and": [
                            ...matchDate
                        
                        ]

                    }
                },
            },
            { $sort: { _id: -1 } },
            ...querydetails

        ]);

        // console.log('Length of Queries');
        // console.log(queries.length);
        finalQuery = queries
        if (category_name !== "all") {
            finalQuery = queries.filter(function (query) {
                return query.category.category_name === category_name;
            })
        }
        return res.status(201).json({
            query_list: finalQuery,
            // query_list: queries,
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

const IdentifyPossibleCategory = async (queries, select) => {

    const manager = new NlpManager({ languages: ['en'], forceNER: true });
    sw = require('stopword')
    // console.log(queries)
    const category = await Category.find()

    category.forEach(element => {
        console.log(element.category_name)

        manager.addDocument('en', element.category_name, element.category_name);
        manager.addAnswer('en', element.categoryname, element.category_name);
    });

    await manager.train();
    manager.save();

    let query_result
    if (select === 1) {
        query_result = await Promise.all(queries.map(async function (query) {
            // //const response = await manager.process('en', sw.removeStopwords(string).join(" "));
            let string
            let key_word
            string = query.query_name.toString().split(' ')
            key_word = sw.removeStopwords(string)

            const response = await manager.process('en', query.query_name);

            let category = "others"

            if (response.intent !== 'None') {
                category = response.intent
            }

            let answer = []
            await response.classifications.forEach((item) => {
                score = item.score
                if (item.score > 0) {
                    answer.push(item.intent)
                }

            })

            query.intent = answer
            query.key_words = key_word
            query.possible_category = category
            return query
        }))
    } else {

        query_result = await Promise.all(queries.map(async function (query) {
            // //const response = await manager.process('en', sw.removeStopwords(string).join(" "));
            const response = await manager.process('en', query.query_name);

            let answer = "others"

            if (response.intent !== 'None') {
                answer = response.intent
            }
            query.possible_category = answer
            return query
        }))
    }

    return query_result;

}

module.exports = {
    NewQuery,
    GetAllQueries,
    ShowQuery,
    EditQuery,
    DeleteQuery,
    ShowQueriesByCategory,
    ShowUnidentifiedQuery,
    ShowPossibleCategory,
    ChangeQueryCategory,
    ShowUnidentifiedQueryByMonth,
    GetCurrentUnidentifiedQuery,
    GetCurrentQuery
};