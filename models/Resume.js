const mongoose = require('mongoose');


const experienceSchema = new mongoose.Schema({
    year: { type: String, required: true }, 
    company: { type: String, required: true },    
    designation: { type: String, required: true }, 
    description: { type: String, required: false } 
}, { _id: false });


const resumeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: String,
    mobile: String,
    email: String,
    summary: String,
    education: String, 
    skills: String,
    certifications: String,
    additionalContent: String,
    profilePicture: String,
    experience: [experienceSchema],
});

module.exports = mongoose.model('Resume', resumeSchema);

