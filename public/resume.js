const socket = io();

let profilePictureUrl = '';

let skillsArray = [];

let experienceStack = [];

function updateResume() {
    const name = document.getElementById('nameInput').value;
    const mobile = document.getElementById('mobileInput').value;
    const email = document.getElementById('emailInput').value;
    const summary = document.getElementById('summaryInput').value;
    const certifications = document.getElementById('certificationsInput').value;
    const experiences = [...experienceStack];
    console.log(experiences);
    const educationElements = document.querySelectorAll('#educationContainer .input-group');
    const education = Array.from(educationElements).map((entry) => {
        const degree = entry.querySelector('.educationDegreeInput').value.trim();
        const year = entry.querySelector('.educationYearInput').value.trim();
        if (degree || year) {
            return `
                <p><strong>${degree}</strong> ${year}</p>
            `;
        }
        return '';
    }).filter(entry => entry).join('');
    
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

    console.log('Resume Data:', resumeData);
    socket.emit('updateResume', resumeData);
}

function addSkill() {
    const skillInput = document.getElementById('skillsInput');
    const skill = skillInput.value.trim();
    
    if (skill && !skillsArray.includes(skill)) {
        skillsArray.push(skill);
        updateSkillsDisplay();
        skillInput.value = '';
        updateResume();
    }
}

document.getElementById('addSkillButton').addEventListener('click', addSkill);

function updateSkillsDisplay() {
    const skillsContainer = document.getElementById('skillsContainer');
    skillsContainer.innerHTML = '';

    skillsArray.forEach((skill, index) => {
        const skillTag = document.createElement('div');
        skillTag.className = 'skill-tag';
        skillTag.textContent = skill;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'x';
        removeButton.className = 'remove-skill-btn';
        removeButton.onclick = () => removeSkill(index);

        skillTag.appendChild(removeButton);
        skillsContainer.appendChild(skillTag);
    });
}

function removeSkill(index) {
    skillsArray.splice(index, 1);
    updateSkillsDisplay();
    updateResume();
}

document.getElementById('skillsInput').addEventListener('keydown', (event) => {
    if (event.key === '') {
        event.preventDefault();
        addSkill();
    }
});

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

    titleInput.addEventListener('input', updateResume);
    newInput.addEventListener('input', updateResume);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.classList.add('remove-content-btn');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
        newInputDiv.remove();
    });

    newInputDiv.appendChild(titleInput);
    newInputDiv.appendChild(newInput);
    newInputDiv.appendChild(removeButton);

    document.getElementById('additionalInputsContainer').appendChild(newInputDiv);
}

document.getElementById('addContentButton').addEventListener('click', addContentField);

document.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', updateResume);
});

document.querySelectorAll('.template-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.template-button').forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
        updateResume();
    });
});

document.getElementById("profilePictureInput").addEventListener("change", async (event) => {
    const file = event.target.files[0];

    if (file) {
        const formData = new FormData();
        formData.append("profilePicture", file);

        const response = await fetch('/upload-profile-picture', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            profilePictureUrl = data.profilePicUrl;
            updateResume();
            isProfilePictureLoaded = true;
        } else {
            alert("Failed to upload the profile picture. Please try again.");
        }
    }
});

socket.on('resumeUpdated', (data) => {
    document.getElementById('resumeFrame').srcdoc = data.resumeContent;
});

updateResume();

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
        const userId = data.userId;
        window.userId = userId;
        alert('Login successful');
    } else {
        alert('Login failed: ' + response.statusText);
    }
}

function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        req.user = { id: req.session.userId };
        next();
    } else {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

function addEducation() {
    const newEducationGroup = document.createElement('div');
    newEducationGroup.className = 'input-group';
    newEducationGroup.innerHTML = `
        <input type="text" placeholder="Degree/Institution" class="educationDegreeInput" required />
        <input type="text" placeholder="Year" class="educationYearInput" required />
        <button class="removeEducationButton" onclick="removeEducation(this)">Remove</button>
    `;

    document.getElementById('educationContainer').appendChild(newEducationGroup);

    const newDegreeInput = newEducationGroup.querySelector('.educationDegreeInput');
    const newYearInput = newEducationGroup.querySelector('.educationYearInput');

    newDegreeInput.addEventListener('input', updateResume);
    newYearInput.addEventListener('input', updateResume);

    updateResume();
}

function addExperience() {
    const year = document.getElementById('yearInput').value.trim();
    const company = document.getElementById('companyInput').value.trim();
    const designation = document.getElementById('designationInput').value.trim();
    const description = document.getElementById('experienceDescriptionInput').value.trim();

    if (year && company && designation) {
        const experienceEntry = { year, company, designation, description };
        experienceStack.push(experienceEntry);
        console.log("Current Experience Stack:", experienceStack);
        document.getElementById('yearInput').value = '';
        document.getElementById('companyInput').value = '';
        document.getElementById('designationInput').value = '';
        document.getElementById('experienceDescriptionInput').value = '';
        updateResume();
        displayExperienceEntries();
    } else {
        console.log("Please fill in all required fields to add experience.");
    }
}

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

function removeExperience(index) {
    experienceStack.splice(index, 1);
    updateResume();
    displayExperienceEntries();
}
