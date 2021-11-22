const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");
const SystemLog = require("../models/SystemLog");
const dotenv = require('dotenv')
require('../middlewares/passport')(passport);
const { SECRET } = require("../config");

/**
 * @DESC To register the user (USER)
 */

dotenv.config({ path: './config.env' });

const userRegister = async (userDets, res) => {
    const { employee_id, first_name, last_name, email, phone_num, gender, address, position, username, password, password2, user_role } = userDets;
    try {
        //Check required fields
        if (!employee_id || !first_name || !last_name || !email || !phone_num || !gender || !address || !position || !username || !password || !password2 || !user_role) {
            return res.status(400).json({
                message: `Please enter all fields`,
                success: false
            });
        }

        //Check passwords match
        if (password != password2) {
            return res.status(400).json({
                message: `Passwords do not match`,
                success: false
            });
        }

        // // Check pass length if less than 8
        if (password.length < 8) {
            return res.status(400).json({
                message: `Password must be at least 6 characters`,
                success: false
            });
        }

        // Validate the username
        let usernameNotTaken = await validateUsername(userDets.username);
        if (!usernameNotTaken) {
            return res.status(400).json({
                message: `Username is already taken.`,
                success: false
            });
        }

        // validate the email
        let emailNotRegistered = await validateEmail(userDets.email);
        if (!emailNotRegistered) {
            return res.status(400).json({
                message: `Email is already registered.`,
                success: false
            });
        }

        // Get the hashed password
        const salt = bcrypt.genSaltSync(10);
        const hashpassword = await bcrypt.hash(userDets.password, salt);
        // create a new user
        const newUser = new User({
            employee_id,
            first_name,
            last_name,
            email,
            phone_num,
            gender,
            address,
            position,
            username,
            password,
            user_role
        });
        newUser.password = hashpassword;

        await newUser.save();
        return res.status(201).json({
            message: "You are successfully registered. ",
            success: true
        });
    } catch (err) {
        console.log(err)
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Unable to create your account.",
            success: false
        });
    }
};

/**
 * @DESC To Login the user ()
 */
const userLogin = async (userCreds, res) => {
    let { username, password } = userCreds;
    // First Check if the username is in the database
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(404).json({
            message: "Username is not found. Invalid login credentials.",
            success: false
        });
    }
    // That means user is existing and trying to signin fro the right portal
    // Now check for the password
    let isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
        // Sign in the token and issue it to the user
        let accessToken = jwt.sign(
            {
                user_id: user._id,
                role: user.user_role,
                username: user.username,
                email: user.email
            },
            SECRET,
            { expiresIn: "7 days" }
        );
        let result = {
            username: user.username,
            role: user.role,
            email: user.email,
            token: `Bearer ${accessToken}`,
            expiresIn: 168
        };

        const systemLog = new SystemLog({
            user_id: user._id
        });

        await systemLog.save();

        return res.status(200).json({
            ...result,
            message: "You are now logged in.",
            success: true
        });
    } else {
        return res.status(403).json({
            message: "Incorrect password.",
            success: false
        });
    }
};

/**
 * @DESC get all users
 */
const getAllUsers = async (req, res) => {

    try {
        // await User.find( function (err, users) {
        //     if (err) return next(err);
        //     res.json({
        //         student_list: users,
        //         succes: true
        //     }).select(['-password']);

        // });
        users = await User.find().select(['-password']);

        return res.json({
            users: users,
            succes: true
        });
    } catch (error) {
        return res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}

/**
 * @DESC get users
 */

const getUser = async (req, id, res) => {

    try {
        let user = await User.findById(id).select(['-password']);
        console.log(user);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        } else {
            return res.json({
                user: user,
                succes: true
            });
        }

    } catch (err) {
        console.log(err)
        res.status(500).json({
            message: "Server Error",
            success: false
        });
    }
}


/**
 * @DESC edit user
 */
const editUser = async (req, id, res) => {
    const { employee_id, first_name, last_name, email, phone_num, gender, address, position, password, password2, username, user_role } = req;
    try {

        let user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not Found",
                success: false
            });
        }

        //Check required fields
        if (!employee_id || !first_name || !last_name || !email || !phone_num || !gender || !address || !position || !username || !user_role) {
            return res.status(400).json({
                message: `Please enter all required fields`,
                success: false
            });
        }

        //Check passwords match
        if (password) {
            if (password != password2) {
                return res.status(400).json({
                    message: `Passwords do not match`,
                    success: false
                });
            }

            // // Check pass length if less than 8
            if (password.length < 8) {
                return res.status(400).json({
                    message: `Password must be at least 6 characters`,
                    success: false
                });
            }
        }


        // Validate the username
        let checkUser = false;
        let usernameNotTaken = await validateUsername(req.username);


        if (username === user.username) {
            checkUser = true;
        } else if (!usernameNotTaken) {
            return res.status(400).json({
                message: `Username is already taken.`,
                success: false
            });
        }

        // validate the email
        let emailNotRegistered = await validateEmail(req.email);
        if (email === user.email) {
            checkEmail = true;
        } else if (!emailNotRegistered) {
            return res.status(400).json({
                message: `Email is already registered.`,
                success: false
            });
        }

        // Get the hashed password
        const salt = bcrypt.genSaltSync(10);

        if (password) {
            const hashpassword = await bcrypt.hash(req.password, salt);
            req.password = hashpassword;
        }


        // await editUser.save();

        await User.findOneAndUpdate({ _id: id }, req, {
            new: true,
            // runValidators: true,
            useFindAndModify: false
        });

        return res.status(201).json({
            message: "User Successfully updated ",
            success: true
        });
    } catch (err) {
        console.log(err)
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Unable to create your account.",
            success: false
        });
    }
};

const editUserInfo = async (req,id,res)=>{
    const { employee_id, first_name, last_name, email, gender, position, user_role } = req;

    try{
        let user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not Found",
                success: false
            });
        }

        //Check required fields
        if (!employee_id || !first_name || !last_name || !email || !gender || !position || !user_role) {
            return res.status(400).json({
                message: `Please enter all required fields`,
                success: false
            });
        }

        // validate the email
        let emailNotRegistered = await validateEmail(req.email);
        if (email === user.email) {
            checkEmail = true;
        } else if (!emailNotRegistered) {
            return res.status(400).json({
                message: `Email is already registered.`,
                success: false
            });
        }

        await User.updateOne({_id:id},{$set:{
            employee_id:employee_id,
            first_name:first_name,
            last_name:last_name,
            email:email,
            gender:gender,
            position:position,
            user_role:user_role}})

        return res.status(201).json({
            message: "User Successfully updated ",
            success: true
        });




    }catch(e){
        console.log(err)
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Unable to edit information",
            success: false
        });
    }
}

const editUserContact = async (req,id,res)=>{
    const { address, phone_num} = req;

    try{
        let user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not Found",
                success: false
            });
        }

        //Check required fields
        if (!address || !phone_num) {
            return res.status(400).json({
                message: `Please enter all required fields`,
                success: false
            });
        }

        await User.updateOne({_id:id},{$set:{
            address:address,
            phone_num:phone_num
        }})

        return res.status(201).json({
            message: "User Successfully updated ",
            success: true
        });




    }catch(e){
        console.log(err)
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Unable to edit information",
            success: false
        });
    }
}

const editUsername = async (req,id,res)=>{
    const { username} = req

    try{
        let user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not Found",
                success: false
            });
        }

        //Check required fields
        if (!username) {
            return res.status(400).json({
                message: `Please enter all required fields`,
                success: false
            });
        }

        // Validate the username
        let checkUser = false;
        let usernameNotTaken = await validateUsername(username);


        if (username === user.username) {
            checkUser = true;
        } else if (!usernameNotTaken) {
            return res.status(400).json({
                message: `Username is already taken.`,
                success: false
            });
        }

        await User.updateOne({_id:id},{$set:{
            username:username,
        }})

        return res.status(201).json({
            message: "User Successfully updated ",
            success: true
        });




    }catch(e){
        console.log(err)
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Unable to edit information",
            success: false
        });
    }
}

const editPassword = async (req,id,res)=>{
    const { oldpassword, newpassword} = req

    try{
        let user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not Found",
                success: false
            });
        }

        //Check required fields
        if (!oldpassword || !newpassword) {
            return res.status(400).json({
                message: `Please enter all required fields`,
                success: false
            });
        }

        let isMatch = await bcrypt.compare(oldpassword, user.password);

        if(!isMatch){
            return res.status(404).json({
                message: `Old Password is Invalid`,
                success: false
            });
        }

        if (newpassword.length < 8) {
            return res.status(400).json({
                message: `Password must be at least 8 characters`,
                success: false
            });
        }

         // Get the hashed password
        const salt = bcrypt.genSaltSync(10);
        const hashpassword = await bcrypt.hash(newpassword, salt);

        await User.updateOne({_id:id},{$set:{
            password:hashpassword,
        }})

        
        return res.status(201).json({
            message: "User Successfully updated ",
            success: true
        });




    }catch(e){
        console.log(err)
        // Implement logger function (winston)
        return res.status(500).json({
            message: "Unable to edit information",
            success: false
        });
    }
}

const ShowSystemLog = async (req, res) => {
    try {

        let systemlog = await SystemLog.aggregate([
            { "$sort" : { "date" : -1} },
            {
                "$lookup": {
                    "from": 'users',
                    "localField": 'user_id',
                    "foreignField": '_id',
                    "as": "user"
                }
            },
            { "$unwind": "$user" },

        ]);

        return res.json({
            users: systemlog,
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

const validateUsername = async username => {
    let user = await User.findOne({ username });
    return user ? false : true;
};

const validateEmail = async email => {
    let user = await User.findOne({ email });
    return user ? false : true;
};
/**
 * @DESC Passport middleware
 */
const userAuth = passport.authenticate("jwt", { session: false });

/**
 * @DESC Check Role Middleware
 */
const checkRole = roles => (req, res, next) =>
    !roles.includes(req.user.role)
        ? res.status(401).json("Unauthorized")
        : next();



const serializeUser = user => {
    return {
        _id: user._id,
        employee_id: user.employee_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_num: user.phone,
        gender: user.gender,
        address: user.address,
        position: user.position,
        user_role: user.user_role,
        updatedAt: user.updatedAt,
        createdAt: user.createdAt
    };
};

module.exports = {
    userAuth,
    checkRole,
    userLogin,
    userRegister,
    serializeUser,
    editUser,
    getAllUsers,
    getUser,
    editUserInfo,
    editUserContact,
    editUsername,
    editPassword,
    ShowSystemLog
};
