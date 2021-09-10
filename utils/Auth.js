const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");
const dotenv = require('dotenv')
require('../middlewares/passport')(passport);
const { SECRET, REFRESH_TOKEN } = require("../config");

/**
 * @DESC To register the user (USER)
 */

dotenv.config({ path: './config.env' });

const userRegister = async (userDets, res) => {
    const { first_name, last_name, email, phone_num, gender, address, position, username, password, password2, user_role } = userDets;
    try {
        
        //Check required fields
        //Check required fields
        if (!first_name || !last_name || !email || !phone_num || !gender || !address || !position || !username || !password || !password2 || !user_role) {
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
        const hashpassword = await bcrypt.hash(userDets.password, 12);
        // create a new user
        const newUser = new User({
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
            message: "You are successfully registred. ",
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
 * @DESC To Login the user (ADMIN, SUPER_ADMIN, USER)
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
        // Create refresh tokrn
        // const refreshToken = jwt.sign(
        //     {
        //         user_id: user._id,
        //         role: user.user_role,
        //         username: user.username,
        //         email: user.email
        //     },
        //     process.env.REFRESH_TOKEN
        // );
        let result = {
            username: user.username,
            role: user.role,
            email: user.email,
            token: `Bearer ${accessToken}`,
            // refreshToken: refreshToken,
            expiresIn: 168
        };

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

const validateUsername = async username => {
    let user = await User.findOne({ username });
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

const validateEmail = async email => {
    let user = await User.findOne({ email });
    return user ? false : true;
};

const serializeUser = user => {
    return {
        username: user.username,
        email: user.email,
        name: user.name,
        _id: user._id,
        updatedAt: user.updatedAt,
        createdAt: user.createdAt
    };
};

module.exports = {
    userAuth,
    checkRole,
    userLogin,
    userRegister,
    serializeUser
};
