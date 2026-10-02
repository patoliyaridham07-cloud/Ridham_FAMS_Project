// Get form

const form = document.getElementById("assignmentForm");


// Get assignment list

const assignmentList = document.getElementById("assignmentList");


// Get search box

const search = document.getElementById("search");


// Load assignments from localStorage

let assignments =
    JSON.parse(localStorage.getItem("assignments")) || [];


// Display assignments when page loads

displayAssignments(assignments);


// Create Assignment

form.addEventListener("submit", function(event) {

    event.preventDefault();


    // Get uploaded file

    const fileInput =
        document.getElementById("chapterFile");


    let fileName = "No file uploaded";


    if (fileInput.files.length > 0) {

        fileName = fileInput.files[0].name;

    }


    // Create assignment object

    const assignment = {

        id: Date.now(),

        faculty:
            document.getElementById("facultyName").value,

        program:
            document.getElementById("program").value,

        semester:
            document.getElementById("semester").value,

        subject:
            document.getElementById("subject").value,

        chapter:
            document.getElementById("chapter").value,

        title:
            document.getElementById("title").value,

        description:
            document.getElementById("description").value,

        questions:
            document.getElementById("questions").value,

        marks:
            document.getElementById("marks").value,

        dueDate:
            document.getElementById("dueDate").value,

        file:
            fileName,

        important:
            document.getElementById("important").checked

    };


    // Add assignment

    assignments.push(assignment);


    // Save assignment

    localStorage.setItem(
        "assignments",
        JSON.stringify(assignments)
    );


    // Display assignments

    displayAssignments(assignments);


    // Clear form

    form.reset();


    // Message

    alert("Assignment created successfully!");


    // Go to assignment section

    document.getElementById("assignments")
        .scrollIntoView({
            behavior: "smooth"
        });

});


// Display Assignments

function displayAssignments(data) {

    assignmentList.innerHTML = "";


    if (data.length === 0) {

        assignmentList.innerHTML =
            "<p>No assignments created yet.</p>";

        return;

    }


    data.forEach(function(assignment) {

        const card =
            document.createElement("div");


        card.className = "assignment-card";


        let importantBadge = "";


        if (assignment.important) {

            importantBadge =
                `<span class="badge">
                    ⭐ Important Assignment
                </span>`;

        }


        card.innerHTML = `

            ${importantBadge}

            <h3>
                ${assignment.title}
            </h3>

            <p>
                <strong>Faculty:</strong>
                ${assignment.faculty}
            </p>

            <p>
                <strong>Program:</strong>
                ${assignment.program}
            </p>

            <p>
                <strong>Semester:</strong>
                ${assignment.semester}
            </p>

            <p>
                <strong>Subject:</strong>
                ${assignment.subject}
            </p>

            <p>
                <strong>Chapter:</strong>
                ${assignment.chapter}
            </p>

            <p>
                <strong>Description:</strong>
                ${assignment.description}
            </p>

            <p>
                <strong>Important Questions:</strong>
                <br>
                ${assignment.questions.replace(/\n/g, "<br>")}
            </p>

            <p>
                <strong>Total Marks:</strong>
                ${assignment.marks}
            </p>

            <p>
                <strong>Submission Date:</strong>
                ${assignment.dueDate}
            </p>

            <div class="file-name">

                📎 <strong>Reference File:</strong>
                ${assignment.file}

            </div>

            <button
                class="delete-btn"
                onclick="deleteAssignment(${assignment.id})"
            >
                Delete Assignment
            </button>

        `;


        assignmentList.appendChild(card);

    });

}


// Delete Assignment

function deleteAssignment(id) {

    const confirmDelete =
        confirm("Are you sure you want to delete this assignment?");


    if (!confirmDelete) {

        return;

    }


    assignments =
        assignments.filter(function(assignment) {

            return assignment.id !== id;

        });


    localStorage.setItem(
        "assignments",
        JSON.stringify(assignments)
    );


    displayAssignments(assignments);

}


// Search Assignment

search.addEventListener("input", function() {

    const searchText =
        search.value.toLowerCase();


    const filtered =
        assignments.filter(function(assignment) {

            return (

                assignment.title
                    .toLowerCase()
                    .includes(searchText)

                ||

                assignment.subject
                    .toLowerCase()
                    .includes(searchText)

                ||

                assignment.program
                    .toLowerCase()
                    .includes(searchText)

                ||

                assignment.chapter
                    .toLowerCase()
                    .includes(searchText)

            );

        });


    displayAssignments(filtered);

});


// Scroll to Create Assignment

function goToCreate() {

    document.getElementById("create")
        .scrollIntoView({
            behavior: "smooth"
        });

}
