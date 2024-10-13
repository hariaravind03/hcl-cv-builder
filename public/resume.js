const socket = io(); // Initialize socket.io connection

// Variable to hold the profile picture URL
let profilePictureUrl = '';

let skillsArray = [];

let experienceStack = [];

// Function to update the resume in the iframe

function updateResume() {
    // Collect input values for other fields
    const name = document.getElementById('nameInput').value;
    const mobile = document.getElementById('mobileInput').value;
    const email = document.getElementById('emailInput').value;
    const summary = document.getElementById('summaryInput').value;
    const certifications = document.getElementById('certificationsInput').value;
    const experiences = [...experienceStack];
    console.log(experiences)
    // Collect multiple education entries
    const educationElements = document.querySelectorAll('#educationContainer .input-group');
    const education = Array.from(educationElements).map((entry) => {
        const degree = entry.querySelector('.educationDegreeInput').value.trim();
        const year = entry.querySelector('.educationYearInput').value.trim();

        // Only return if both fields have values
        if (degree || year) {
            return `
                <p><strong>${degree}</strong> ${year}</p>
            `;
        }
        return ''; // return empty string if not valid
    }).filter(entry => entry).join(''); // Filter out empty entries


    // Collect additional content with titles
    const additionalInputs = Array.from(document.querySelectorAll('.additional-input'));
    const additionalTitles = Array.from(document.querySelectorAll('.additional-title'));
    const additionalContent = additionalInputs.map((input, index) => {
        const title = additionalTitles[index].value.trim() || 'Additional Info';
        const content = input.value.trim();
        return content ? `<div class="section">
                            <h2>${title}</h2>
                            <div class="info">${content}</div>
                        </div>` : '';
    }).filter(entry => entry).join('.');

    const skills = skillsArray.join('<br>');

    const resumeData = {
        profilePicture: profilePictureUrl,
        name,
        mobile,
        email,
        summary,
        education,
        skills,
        certifications,
        experiences,
        additionalContent,
        template: document.querySelector('.template-button.selected')?.dataset.template,
    };

    // Log the complete resume data for debugging
    console.log('Resume Data:', resumeData);

    // Emit resume update event
    socket.emit('updateResume', resumeData);
}




// Function to send skills to the server

function addSkill() {
    const skillInput = document.getElementById('skillsInput');
    const skill = skillInput.value.trim();

    if (skill && !skillsArray.includes(skill)) { // Prevent duplicates
        skillsArray.push(skill); // Add skill to the array
        updateSkillsDisplay(); // Update the skills display
        skillInput.value = ''; // Clear the input
        updateResume(); // Update the resume with new skills
    }
}

document.getElementById('addSkillButton').addEventListener('click', addSkill);

function updateSkillsDisplay() {
    const skillsContainer = document.getElementById('skillsContainer');
    skillsContainer.innerHTML = ''; // Clear existing skills

    // Render skills
    skillsArray.forEach((skill, index) => {
        const skillTag = document.createElement('div');
        skillTag.className = 'skill-tag'; // Add a class for styling
        skillTag.textContent = skill;

        // Create a remove button
        const removeButton = document.createElement('button');
        removeButton.textContent = 'x';
        removeButton.className = 'remove-skill-btn';
        removeButton.onclick = () => removeSkill(index); // Bind remove function

        skillTag.appendChild(removeButton);
        skillsContainer.appendChild(skillTag);
    });
}

function removeSkill(index) {
    skillsArray.splice(index, 1); // Remove skill from the array
    updateSkillsDisplay(); // Update the skills display
    updateResume(); // Update the resume
}

document.getElementById('skillsInput').addEventListener('keydown', (event) => {
    if (event.key === '') {
        event.preventDefault(); // Prevent form submission
        addSkill(); // Call add skill function
    }
});

// Function to add new content fields dynamically
function addContentField() {
    const newInputDiv = document.createElement('div');
    newInputDiv.classList.add('input-group');

    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.classList.add('additional-title');
    titleInput.placeholder = 'Title for Additional Info';

    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.classList.add('additional-input');
    newInput.placeholder = 'Additional Info';

    // Attach input listeners to new fields for real-time update
    titleInput.addEventListener('input', updateResume);
    newInput.addEventListener('input', updateResume);

    // Create a "Remove" button
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.classList.add('remove-content-btn');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
        newInputDiv.remove(); // Remove the content section when clicked
    });

    // Append inputs and remove button to the new div
    newInputDiv.appendChild(titleInput);
    newInputDiv.appendChild(newInput);
    newInputDiv.appendChild(removeButton);

    // Add the new group to the container
    document.getElementById('additionalInputsContainer').appendChild(newInputDiv);
}

// Event listener for adding content fields
document.getElementById('addContentButton').addEventListener('click', addContentField);

// Input change listener to trigger resume update in real-time
document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', updateResume);
});

// Template selection handling
document.querySelectorAll('.template-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.template-button').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        updateResume(); // Update resume preview with selected template
    });
});

// Variable to track if a profile picture is already loaded

document.getElementById("profilePictureInput").addEventListener("change", async (event) => {
    const file = event.target.files[0];

    if (file) {
        const formData = new FormData();
        formData.append("profilePicture", file);

        // Send the image to the server
        const response = await fetch('/upload-profile-picture', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            profilePictureUrl = data.profilePicUrl; // Store the URL for resume updates
            updateResume(); // Update the resume with the new profile picture URL

            isProfilePictureLoaded = true; // Update the variable after a successful upload
 // Optional: Confirmation message
        } else {
            alert("Failed to upload the profile picture. Please try again."); // Optional: Error message
        }
    }
});

// Function to programmatically load a file into the input


// Example usage of loadProfilePicture function
// You can call this function with a file object obtained from somewhere else
// loadProfilePicture(yourFileObject);

// Listen for resume updates from the server to update iframe content
socket.on('resumeUpdated', (data) => {
    document.getElementById('resumeFrame').srcdoc = data.resumeContent;
});

// Trigger initial resume update
updateResume();

// Login function
async function login() {
    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
        const data = await response.json();
        const userId = data.userId; // Store user ID for later use
        window.userId = userId; // Or use sessionStorage.setItem('userId', userId);
        alert('Login successful');
    } else {
        alert('Login failed: ' + response.statusText);
    }
}

// Middleware to check if the user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        req.user = { id: req.session.userId }; // Attach user ID to the request object
        next(); // Proceed to the next middleware or route handler
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
}


// Add event listeners to education input fields



// Add the first set of listeners when the page loads


// Function to add new education input fields
function addEducation() {
    const newEducationGroup = document.createElement('div');
    newEducationGroup.className = 'input-group';
    newEducationGroup.innerHTML = `
        <input type="text" placeholder="Degree/Institution" class="educationDegreeInput" required />
        <input type="text" placeholder="Year" class="educationYearInput" required />
        <button class="removeEducationButton" onclick="removeEducation(this)">Remove</button>
    `;
    
    // Append the new education group to the container
    document.getElementById('educationContainer').appendChild(newEducationGroup);

    // Select the new input fields
    const newDegreeInput = newEducationGroup.querySelector('.educationDegreeInput');
    const newYearInput = newEducationGroup.querySelector('.educationYearInput');

    // Add input event listeners to the new input fields
    newDegreeInput.addEventListener('input', updateResume);
    newYearInput.addEventListener('input', updateResume);

    // Call updateResume to refresh the data
    updateResume();
}


// Define the stack globally to hold experience entries

// Function to add experience entry to the stack
function addExperience() {
    // Get input values
    const year = document.getElementById('yearInput').value.trim();
    const company = document.getElementById('companyInput').value.trim();
    const designation = document.getElementById('designationInput').value.trim();
    const description = document.getElementById('experienceDescriptionInput').value.trim();

    // Check if all fields are filled
    if (year && company && designation) { // Removed description check since it's optional
        // Create an experience entry object
        const experienceEntry = { year, company, designation, description }; // Ensure all required fields are included

        // Push the entry to the stack
        experienceStack.push(experienceEntry);

        // Log the stack to verify entries are added
        console.log("Current Experience Stack:", experienceStack);

        // Clear inputs after adding
        document.getElementById('yearInput').value = '';
        document.getElementById('companyInput').value = '';
        document.getElementById('designationInput').value = '';
        document.getElementById('experienceDescriptionInput').value = '';

        // Display added entries for confirmation (if applicable)
        updateResume(); // Assuming this function updates your resume display
        displayExperienceEntries(); // Assuming this function displays the experience entries
    } else {
        console.log("Please fill in all required fields to add experience.");
    }
}


// Function to display experiences from the stack
function displayExperienceEntries() {
    const experienceContainer = document.getElementById('experienceEntries');
    experienceContainer.innerHTML = experienceStack.map((entry, index) => `
        <div class="experience-entry">
            <p><strong>${entry.designation}</strong> at <em>${entry.company}</em> (${entry.year})</p>
            <p>${entry.description}</p>
            <button onclick="removeExperience(${index})">Remove</button>
        </div>
    `).join('');
}

// Function to remove an experience entry by index
function removeExperience(index) {
    // Remove the entry at the specified index
    experienceStack.splice(index, 1);
    updateResume();
    // Re-render the experience entries to reflect changes
    displayExperienceEntries();
}

