const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose'); // Ensure this line is present
const bcrypt = require('bcrypt');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Initialize Express app and Socket.io
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Make uploads folder accessible

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/resumeBuilder')
    .then(() => {
        console.log('MongoDB connected');
    })
    .catch(err => console.log(err));

// Set up session management
app.use(session({
    secret: 'yourSecretKey', // Change this to a strong secret
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/resumeBuilder' }),
}));

// User and Resume models
const User = require('./models/User'); // Ensure this file exists and exports the User model
const Resume = require('./models/Resume'); // Ensure this file exists and exports the Resume model

// Handle incoming socket connections
io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for resume updates from the client
    socket.on('updateResume', async (resumeData) => {
        const template = resumeData.template || 'template1';
        const resumeContent = generateResumeContent(resumeData, template);

        // Emit the updated resume content back to the client
        socket.emit('resumeUpdated', { resumeContent });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Endpoint to handle profile picture uploads
app.post('/upload-profile-picture', upload.single('profilePicture'), (req, res) => {
    const profilePicUrl = `/uploads/${req.file.filename}`;
    res.send({ profilePicUrl }); // Return the URL path to the client
});

// Function to generate resume HTML content based on the template
// Function to generate resume HTML content based on the template
function generateResumeContent(resumeData, template) {
    const profilePicHtml = resumeData.profilePicture 
        ? `<img src="${resumeData.profilePicture}" alt="Profile Picture" style="width: 150px; border-radius: 20px; vertical-align: middle; margin-right: 10px;" />` 
        : '';

    const nameHtml = `<h1 style="display: inline-block; vertical-align: middle;">${resumeData.name || 'No Name Provided'}</h1>`;

    const additionalContentHtml = resumeData.additionalContent
        .split('.')
        .map(content => content.trim() ? `${content.trim()}` : '')
        .join('');

    // Use education HTML as-is without splitting by <br>
    const educationHtml = resumeData.education 
        ? `<div class="education-section">${resumeData.education}</div>`
        : '<div>No Education Info Provided</div>';

    const skillsHtml = resumeData.skills 
        ? resumeData.skills.split('<br>').map(skill => `<div class="skill-item">${skill}</div>`).join('')
        : '<div>No Skills Info Provided</div>';

    // Experience HTML: Collecting experiences
    const experiencesHtml = resumeData.experiences && resumeData.experiences.length > 0
        ? `<div class="experience-section">
            ${resumeData.experiences.map(exp => `
                <div class="experience-entry">
                    <strong>${exp.designation}</strong> at <em>${exp.company}</em> (${exp.year})<br>
                    <p>${exp.description}</p>
                </div>`).join('')}
          </div>`
        : '<div>No Experience Info Provided</div>';

        
        switch (template) {
            case 'template1':
                return `
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            margin: 0;
                            padding: 20px;
                            background-color: #f7f7f7;
                        }
                        .container {
                            max-width: 800px;
                            margin: auto;
                            padding: 20px;
                            background: white;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .name {
                            font-size: 28px;
                            font-weight: bold;
                            color: #333;
                        }
                        .contact {
                            font-size: 14px;
                            color: #555;
                        }
                        .section {
                            margin-bottom: 20px;
                        }
                        h2 {
                            color: #007BFF;
                            border-bottom: 2px solid #007BFF;
                            padding-bottom: 5px;
                            margin-bottom: 10px;
                        }
                        .info {
                            margin: 5px 0;
                        }
                        .skill, .experience-entry, .education-item {
                            padding: 5px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            ${profilePicHtml}
                            <div class="name">${nameHtml}</div>
                            <div class="contact">Mobile: ${resumeData.mobile || 'N/A'} | Email: ${resumeData.email || 'N/A'}</div>
                        </div>
                        <div class="section"><h2>Summary</h2><div class="info">${resumeData.summary || 'No Summary Info Provided'}</div></div>
                        <div class="section"><h2>Education</h2><div class="info">${educationHtml || 'No Education Info Provided'}</div></div>
                        <div class="section"><h2>Skills</h2><div class="info">${skillsHtml || 'No Skills Info Provided'}</div></div>
                        <div class="section"><h2>Experience</h2><div class="info">${experiencesHtml || 'No Experience Info Provided'}</div></div>
                        ${additionalContentHtml }
                    </div>
                </body>
                </html>`;
        
            case 'template2':
                return `
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Helvetica', sans-serif; /* Changed to Helvetica */
                            margin: 0;
                            padding: 20px;
                            background-color: #ffffff;
                        }
                        .container {
                            max-width: 800px;
                            margin: auto;
                            padding: 20px;
                            border: 1px solid #ccc;
                            border-radius: 5px;
                            background: #f9f9f9;
                        }
                        .header {
                            text-align: left;
                            margin-bottom: 30px;
                        }
                        .name {
                            font-size: 32px;
                            font-weight: bold;
                            color: #333;
                        }
                        .contact {
                            font-size: 14px;
                            color: #666;
                        }
                        h2 {
                            color: #4CAF50;
                            border-bottom: 2px solid #4CAF50;
                            padding-bottom: 5px;
                            margin-bottom: 10px;
                        }
                        .info {
                            margin: 5px 0;
                        }
                        .education-item, .experience-entry, .skill {
                            margin: 5px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            ${profilePicHtml}
                            <div class="name">${nameHtml}</div>
                            <div class="contact">Mobile: ${resumeData.mobile || 'N/A'} | Email: ${resumeData.email || 'N/A'}</div>
                        </div>
                        <div class="section"><h2>Summary</h2><div class="info">${resumeData.summary || 'No Summary Info Provided'}</div></div>
                        <div class="section"><h2>Education</h2><div class="info">${educationHtml || 'No Education Info Provided'}</div></div>
                        <div class="section"><h2>Skills</h2><div class="info">${skillsHtml || 'No Skills Info Provided'}</div></div>
                        <div class="section"><h2>Experience</h2><div class="info">${experiencesHtml || 'No Experience Info Provided'}</div></div>
                        ${additionalContentHtml}
                    </div>
                </body>
                </html>`;
        
            case 'template3':
                return `
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Courier New', Courier, monospace;
                            margin: 0;
                            padding: 20px;
                            background-color: #f2f2f2;
                        }
                        .container {
                            max-width: 800px;
                            margin: auto;
                            padding: 20px;
                            background: white;
                            border-left: 5px solid #FF5722; /* A bold left border for style */
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
                        }
                        .header {
                            text-align: left; /* Align text to the left */
                            margin-bottom: 30px;
                        }
                        .name {
                            font-size: 26px;
                            font-weight: bold;
                            color: #444;
                            text-transform: uppercase; /* Uppercase name for emphasis */
                        }
                        .contact {
                            font-size: 12px;
                            color: #777;
                        }
                        h2 {
                            color: #FF5722; /* A vibrant accent color for headers */
                            border-bottom: 2px dashed #FF5722; /* Dashed underline for section headers */
                            padding-bottom: 5px;
                            margin-bottom: 10px;
                        }
                        .info {
                            margin: 5px 0;
                            font-size: 14px; /* Slightly larger font size for clarity */
                            line-height: 1.5; /* Improved line height for readability */
                        }
                        .education-item, .experience-entry, .skill {
                            margin: 5px 0;
                            padding: 5px 0;
                            border-bottom: 1px solid #e0e0e0; /* Light separator for entries */
                        }
                        .footer {
                            margin-top: 20px;
                            font-size: 12px;
                            text-align: center;
                            color: #aaa;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            ${profilePicHtml}
                            <div class="name">${nameHtml}</div>
                            <div class="contact">Mobile: ${resumeData.mobile || 'N/A'} | Email: ${resumeData.email || 'N/A'}</div>
                        </div>
                        <div class="section"><h2>Summary</h2><div class="info">${resumeData.summary || 'No Summary Info Provided'}</div></div>
                        <div class="section"><h2>Education</h2><div class="info">${educationHtml || 'No Education Info Provided'}</div></div>
                        <div class="section"><h2>Skills</h2><div class="info">${skillsHtml || 'No Skills Info Provided'}</div></div>
                        <div class="section"><h2>Experience</h2><div class="info">${experiencesHtml || 'No Experience Info Provided'}</div></div>
                        ${additionalContentHtml}
                    </div>
                </body>
                </html>`;
        
            case 'template4':
                return `
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Times New Roman', Times, serif; /* Changed to Times New Roman */
                            margin: 0;
                            padding: 20px;
                            background-color: #ffffff;
                        }
                        .container {
                            max-width: 800px;
                            margin: auto;
                            padding: 20px;
                            border: 1px solid #ccc;
                            border-radius: 5px;
                            background: #fff;
                        }
                        .header {
                            text-align: right;
                        }
                        .name {
                            font-size: 26px;
                            font-weight: bold;
                            color: #333;
                        }
                        .contact {
                            font-size: 12px;
                            color: #777;
                        }
                        h2 {
                            font-size: 22px;
                            color: #4CAF50; /* Kept professional color */
                        }
                        .info {
                            margin: 5px 0;
                        }
                        .education-item, .experience-entry, .skill {
                            margin: 5px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            ${profilePicHtml}
                            <div class="name">${nameHtml}</div>
                            <div class="contact">Mobile: ${resumeData.mobile || 'N/A'} | Email: ${resumeData.email || 'N/A'}</div>
                        </div>
                        <div class="section"><h2>Summary</h2><div class="info">${resumeData.summary || 'No Summary Info Provided'}</div></div>
                        <div class="section"><h2>Education</h2><div class="info">${educationHtml || 'No Education Info Provided'}</div></div>
                        <div class="section"><h2>Skills</h2><div class="info">${skillsHtml || 'No Skills Info Provided'}</div></div>
                        <div class="section"><h2>Experience</h2><div class="info">${experiencesHtml || 'No Experience Info Provided'}</div></div>
                        ${additionalContentHtml }
                    </div>
                </body>
                </html>`;
        }
    }


app.get('/check-session', (req, res) => {
    if (req.session.userId) {
        User.findById(req.session.userId).then(user => {
            res.send({ isAuthenticated: true, username: user.username });
        });
    } else {
        res.send({ isAuthenticated: false });
    }
});


// Registration Route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).send('User already exists');
    }

    // Hash the password and save the user
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).send('User registered successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.locals.isAuthenticated = false; // User is not logged in
    next();
}

// Login Route
// After your session middleware
app.use(isAuthenticated);

// Login Route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
        return res.status(400).send('User not found');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).send('Invalid password');
    }

    // Save user info in session
    req.session.userId = user._id;

    // Send back user info
    res.send({ message: 'Logged in successfully', userId: user._id, username: user.username });
});

// Logout Route remains unchanged


// Logout Route
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Could not log out');
        }
        res.send('Logged out successfully');
    });
});

// Save Resume Route
// Save Resume Route
app.post('/save-resume', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'User not logged in' });
    }

    try {
        // Find or create a new resume for the user
        let resume = await Resume.findOne({ userId: req.session.userId }) || new Resume({ userId: req.session.userId });

        // Update resume fields with data from request after validation
        resume.name = req.body.name || '';
        resume.mobile = req.body.mobile || '';
        resume.email = req.body.email || '';
        resume.summary = req.body.summary || '';
        resume.education = req.body.education || '';
        resume.skills = req.body.skills || '';
        resume.certifications = req.body.certifications || '';
        resume.additionalContent = req.body.additionalContent || '';
        resume.profilePicture = req.body.profilePicture || '';
        resume.experience = Array.isArray(req.body.experience) ? req.body.experience : [];

        // Save the updated resume to the database
        await resume.save();
        res.json({ message: 'Resume saved successfully' });
    } catch (error) {
        console.error('Error saving resume:', error);
        res.status(500).json({ message: 'Error saving resume' });
    }
});


// Fetch Resume Data for Logged-In User
app.get('/resume-data', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).send('User not logged in');
    }

    try {
        const resume = await Resume.findOne({ userId: req.session.userId });
        if (resume) {
            res.json(resume);
        } else {
            res.status(404).send('Resume not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving resume');
    }
});


// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/home.html`);
});
