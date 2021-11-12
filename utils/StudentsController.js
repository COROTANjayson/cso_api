
const passport = require("passport");
const Student = require("../models/Student");
const SMSMessage = require("../models/SMSMessage");
const Query = require("../models/Query");
require('../middlewares/passport')(passport);
const { SECRET } = require("../config");
const ObjectId = mongoose.Types.ObjectId;

// //Show all 
const ShowAllStudent = async (req, res) => {

    try {
        await Student.find(function (err, student) {
            if (err) return next(err);
            res.json({
                student_list: student,
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

//Show Student
const ShowStudent = async (req, id, res) => {

    try {
        let student = await Student.findById(id);
        console.log(student)

        if (!student) {
            return res.status(404).json({
                message: "Student not Found",
                success: false
            });
        } else {
            return res.json({
                Student: student,
                succes: true
            });
        }

    } catch (err) {
        res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}

// Create new Student
const AddStudent = async (req, res) => {
    const { student_id, email, first_name, last_name, phone_number, gender, address, school } = req;

    try {
        // console.log(user_id)
        //Check required fields
        if (!student_id || !email || !first_name || !last_name || !phone_number || !gender || !address || !school) {
            return res.status(400).json({
                message: `Please enter all fields`,
                success: false
            });
        }

        let studentIDtaken = await Student.findOne({ student_id });

        if (studentIDtaken) {
            return res.status(400).json({
                message: `Student ID is already registered`,
                success: false
            });
        }
        // create a new FAQ
        const newStudent = new Student({
            student_id,
            email,
            first_name,
            last_name,
            phone_number,
            gender,
            address,
            school
        });

        await newStudent.save();
        return res.status(201).json({
            message: "Added new student ",
            success: true
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Unable to add new Student",
            success: false
        });
    }
};

// Edit Student
const EditStudent = async (req, id, res) => {
    try {
        let student = await Student.findById(id);

        if (!student) {
            return res.status(404).json({
                message: "Student not Found",
                success: false
            });
        }
        await Student.findOneAndUpdate({ _id: id }, req, {
            new: true,
            runValidators: true,
        });

        return res.status(201).json({
            message: "Updated Successfully",
            success: true
        });

    } catch (err) {
        return res.status(500).json({
            message: "Cannot update student",
            success: false
        });
    }
}

// Delete Student
const DeleteStudent = async (req, id, res) => {
    console.log(req)
    try {
        let student = await Student.findById(id);

        if (!student) {
            return res.status(404).json({
                message: "Student not Found",
                success: false
            });
        }
        await Student.remove({ _id: id });

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

const GetAllInquirerRecords = async (req, res) => {

    try {
        const records = await Query.aggregate([
            {"$match":{'phone_num':{$nin: [ ' ',null, '8080', 'AutoloadMax', 'TM', '4438' ]} }},
        
            {
                "$lookup": {
                    "from": 'students',
                    "localField": 'phone_num',
                    "foreignField": 'phone_number',
                    "as": "student"
                }
            },
           
            {
                "$unwind": {
                    "path": "$student",
                    "preserveNullAndEmptyArrays": true
                }
            },
            
        ]);

         records.map(function(el) {
            if(el.student === undefined) { 
                el.student = null;
            }
          })
        
        const key = 'phone_num';

        const arrayUniqueByKey = [...new Map(records.map(item =>
        [item[key], item])).values()];

        return res.json({
            records: arrayUniqueByKey,
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

const GetInquirerRecords = async (req, phonenumber ,res) => {
    try {
        
        const records = await Query.aggregate([
            {"$match":{'phone_num':{$nin: [ ' ',null, '8080', 'AutoloadMax', 'TM', '4438' ]} }},
            { "$match":  { "phone_num": `${phonenumber}` } }  ,
           
            {
                "$lookup": {
                    "from": 'students',
                    "localField": 'phone_num',
                    "foreignField": 'phone_number',
                    "as": "student"
                }
            },
           
            {
                "$unwind": {
                    "path": "$student",
                    "preserveNullAndEmptyArrays": true
                }
            },
        ]);

         records.map(function(el) {
            if(el.student === undefined) { 
                el.student = null;
            }
          })
        
        console.log(records.length)
        return res.json({
            records: records,
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

const SelectBroadcast = async (req, res) => {

    try {
        
        const {school, course } = req;
        let records
        if (course.length && school.length){
            records = await Student.aggregate([
                {"$match":{'phone_number':{$nin: [ ' ',null, '8080', 'AutoloadMax', 'TM', '4438' ]} }},
                 { "$match": { "$or": [ { "school": { "$in": [...school]}}, { "course": { "$in": [...course]} } ] } },  
            ]);
        } else {
             records = await Student.aggregate([
                {"$match":{'phone_number':{$nin: [ ' ',null, '8080', 'AutoloadMax', 'TM', '4438' ]} }},
                { "$match": { "$or": [ { "school": { "$in": [...school]}}, { "course": { "$in": [...course]} } ] } },  
                // { "$match": { "$or": [ { "course":  { "$in": ['BSCE', 'BSIT']} } ] } },  
            ]);
        }
        return res.json({
            list: records,
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


module.exports = {
    AddStudent,
    ShowAllStudent,
    ShowStudent,
    EditStudent,
    DeleteStudent,
    GetAllInquirerRecords,
    GetInquirerRecords,
    SelectBroadcast
};