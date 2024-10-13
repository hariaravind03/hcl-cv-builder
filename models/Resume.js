const mongoose = require('mongoose');

// Schema for education records
const experienceSchema = new mongoose.Schema({
    year: { type: String, required: true },      // Year of experience
    company: { type: String, required: true },    // Company name
    designation: { type: String, required: true }, // Job title
    description: { type: String, required: false } // Optional description
}, { _id: false }); // Disable automatic ID generation for subdocuments
// Main resume schema
const resumeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: String,
    mobile: String,
    email: String,
    summary: String,
    education: String, // Change education to an array of education objects
    skills: String,
    certifications: String,
    additionalContent: String,
    profilePicture: String,
    experience: [experienceSchema],
});

// Export the model
module.exports = mongoose.model('Resume', resumeSchema);

