const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    // You can add more fields as needed, e.g., email, profile picture, etc.
});

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User; // Export the User model
