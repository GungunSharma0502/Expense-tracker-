const validator = require('validator');

const validateSignupData = (req) => {
    const { firstName, lastName, emailId, password } = req.body;

    // Check if all required fields are present
    if (!firstName || !emailId || !password) {
        throw new Error("First name, email, and password are required");
    }

    // Validate first name
    if (firstName.trim().length < 3) {
        throw new Error("First name must be at least 2 characters long");
    }

    if (firstName.length > 30) {
        throw new Error("First name must not exceed 30 characters");
    }

    // Validate last name if provided
    if (lastName && lastName.length > 30) {
        throw new Error("Last name must not exceed 30 characters");
    }

    // Validate email
    if (!validator.isEmail(emailId)) {
        throw new Error("Please enter a valid email address");
    }

    // Validate password strength
    if (!validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    })) {
        throw new Error("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character");
    }
};

const validateLoginData = (req) => {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
        throw new Error("Email and password are required");
    }

    if (!validator.isEmail(emailId)) {
        throw new Error("Please enter a valid email address");
    }
};

const validateReviewData = (req) => {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
        throw new Error("Review message is required");
    }

    if (message.trim().length < 10) {
        throw new Error("Review message must be at least 10 characters long");
    }

    if (message.length > 300) {
        throw new Error("Review message must not exceed 300 characters");
    }
};

module.exports = {
    validateSignupData,
    validateLoginData,
    validateReviewData
};