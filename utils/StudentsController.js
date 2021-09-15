
const passport = require("passport");
const Student = require("../models/Student");

require('../middlewares/passport')(passport);
const { SECRET } = require("../config");


// //Show all FAQ
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
            message: "Unable to add new FAQ",
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
        console.error(err)
        res.render('error/404')
    }
}

// Create new Student
const AddStudent = async (req, res) => {
    const { student_id, sender_number, first_name, last_name, phone_number, gender, address, school } = req;

    try {
        // console.log(user_id)
        //Check required fields
        if (!student_id || !sender_number || !first_name || !last_name || !phone_number || !gender || !address || !school) {
            return res.status(400).json({
                message: `Please enter all fields`,
                success: false
            });
        }
        // create a new FAQ
        const newStudent = new Student({
            student_id,
            sender_number,
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

//Show Student
const SearchStudent = async (req, search_item, res) => {
//     try {
//         student = await Student.find({
//             $or: [
//                 { student_id: search_item },
//                 { last_name: search_item }
//             ]
//         });

//         if (!student) {
//             return res.status(404).json({
//                 message: "Student not Found",
//                 success: false
//             });
//         } else {
//             return res.json({
//                 student: student,
//                 succes: true
//             });
//         }


//     } catch (error) {
//         return res.status(500).json({
//             message: "Unable tp search for the moementr",
//             success: false
//         });
//     }

}

module.exports = {
    AddStudent,
    ShowAllStudent,
    ShowStudent,
    EditStudent,
    DeleteStudent,
    SearchStudent
};