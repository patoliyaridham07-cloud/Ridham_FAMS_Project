// ========================================
// FACULTY ASSIGNMENT MANAGEMENT SYSTEM
// ========================================


// Get existing assignments

let assignments =
    JSON.parse(
        localStorage.getItem("facultyAssignments")
    ) || [];


// ========================================
// ADD IMPORTANT QUESTION
// ========================================

function addQuestion() {

    const container =
        document.getElementById(
            "questionContainer"
        );

    const number =
        container.children.length + 1;


    const row =
        document.createElement("div");

    row.className = "question-row";


    row.innerHTML = `

        <span class="question-number">
            Q${number}
        </span>

        <input
            type="text"
            class="question-input"
            placeholder="Enter important question"
        >

        <button
            type="button"
            class="remove-question"
            onclick="removeQuestion(this)"
        >
            ×
        </button>

    `;


    container.appendChild(row);

    updateQuestionNumbers();
}


// ========================================
// REMOVE QUESTION
// ========================================

function removeQuestion(button) {

    const row =
        button.parentElement;

    row.remove();

    updateQuestionNumbers();
}


// ========================================
// UPDATE QUESTION NUMBERS
// ========================================

function updateQuestionNumbers() {

    const rows =
        document.querySelectorAll(
            ".question-row"
        );


    rows.forEach(function(row, index) {

        row.querySelector(
            ".question-number"
        ).textContent =
            "Q" + (index + 1);

    });
}


// ========================================
// PDF FILE
// ========================================

const pdfFile =
    document.getElementById("pdfFile");


pdfFile.addEventListener(
    "change",
    function() {

        const file =
            this.files[0];


        if (!file) {

            document.getElementById(
                "fileName"
            ).textContent =
                "No PDF selected";

            return;
        }


        if (
            file.type !==
            "application/pdf"
        ) {

            alert(
                "Please select a PDF file only."
            );

            this.value = "";

            return;
        }


        document.getElementById(
            "fileName"
        ).textContent =
            "Selected PDF: " +
            file.name;

    }
);


// ========================================
// CREATE ASSIGNMENT
// ========================================

const form =
    document.getElementById(
        "assignmentForm"
    );


form.addEventListener(
    "submit",
    function(event) {

        event.preventDefault();


        // Get form values

        const title =
            document.getElementById(
                "title"
            ).value.trim();


        const subject =
            document.getElementById(
                "subject"
            ).value;


        const semester =
            document.getElementById(
                "semester"
            ).value;


        const marks =
            document.getElementById(
                "marks"
            ).value;


        const deadline =
            document.getElementById(
                "deadline"
            ).value;


        const faculty =
            document.getElementById(
                "faculty"
            ).value.trim();


        const description =
            document.getElementById(
                "description"
            ).value.trim();


        // PDF

        const file =
            document.getElementById(
                "pdfFile"
            ).files[0];


        // Get questions

        const questionInputs =
            document.querySelectorAll(
                ".question-input"
            );


        const questions = [];


        questionInputs.forEach(
            function(input) {

                const question =
                    input.value.trim();


                if (question !== "") {

                    questions.push(
                        question
                    );

                }

            }
        );


        // Validate questions

        if (questions.length === 0) {

            alert(
                "Please add at least one important question."
            );

            return;
        }


        // PDF name

        let pdfName = "";

        if (file) {

            pdfName = file.name;

        }


        // Create assignment object

        const assignment = {

            id: Date.now(),

            title: title,

            subject: subject,

            semester: semester,

            marks: marks,

            deadline: deadline,

            faculty: faculty,

            description: description,

            pdfName: pdfName,

            questions: questions,

            status: "Pending",

            createdDate:
                new Date().toLocaleDateString()

        };


        // Add assignment

        assignments.push(
            assignment
        );


        // Save

        saveAssignments();


        // Reset form

        form.reset();


        document.getElementById(
            "fileName"
        ).textContent =
            "No PDF selected";


        // Reset questions

        document.getElementById(
            "questionContainer"
        ).innerHTML = `

            <div class="question-row">

                <span class="question-number">
                    Q1
                </span>

                <input
                    type="text"
                    class="question-input"
                    placeholder="Enter important question"
                >

                <button
                    type="button"
                    class="remove-question"
                    onclick="removeQuestion(this)"
                >
                    ×
                </button>

            </div>

        `;


        displayAssignments();


        alert(
            "🎉 Assignment published successfully!"
        );


        // Move to assignment section

        document.getElementById(
            "assignments"
        ).scrollIntoView();

    }
);


// ========================================
// SAVE ASSIGNMENTS
// ========================================

function saveAssignments() {

    localStorage.setItem(
        "facultyAssignments",
        JSON.stringify(assignments)
    );

}


// ========================================
// DISPLAY ASSIGNMENTS
// ========================================

function displayAssignments(
    searchText = ""
) {

    const list =
        document.getElementById(
            "assignmentList"
        );


    list.innerHTML = "";


    const filtered =
        assignments.filter(
            function(assignment) {

                return (

                    assignment.title
                        .toLowerCase()
                        .includes(
                            searchText.toLowerCase()
                        )

                    ||

                    assignment.subject
                        .toLowerCase()
                        .includes(
                            searchText.toLowerCase()
                        )

                );

            }
        );


    if (filtered.length === 0) {

        list.innerHTML = `

            <div class="assignment-card">

                <h3>
                    No Assignment Found
                </h3>

                <p>
                    Create your first assignment
                    using the form above.
                </p>

            </div>

        `;

        updateDashboard();

        return;
    }


    filtered.forEach(
        function(assignment) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "assignment-card";


            let questionHTML = "";


            if (
                assignment.questions &&
                assignment.questions.length > 0
            ) {

                questionHTML = `

                    <div class="questions-list">

                        <strong>
                            ⭐ Important Questions
                        </strong>

                        <ol>

                            ${assignment.questions
                                .map(
                                    question =>
                                        `<li>${question}</li>`
                                )
                                .join("")}

                        </ol>

                    </div>

                `;

            }


            let pdfHTML = "";


            if (assignment.pdfName) {

                pdfHTML = `

                    <div class="pdf-link">

                        📄 PDF:
                        ${assignment.pdfName}

                    </div>

                `;

            }


            const statusClass =
                assignment.status ===
                "Completed"
                    ? "status completed"
                    : "status";


            card.innerHTML = `

                <h3>
                    ${assignment.title}
                </h3>


                <div class="assignment-meta">

                    <span class="badge">
                        📚 ${assignment.subject}
                    </span>

                    <span class="badge">
                        🎓 ${assignment.semester}
                    </span>

                    <span class="badge">
                        🎯 ${assignment.marks} Marks
                    </span>

                    <span class="badge">
                        📅 ${assignment.deadline}
                    </span>

                </div>


                <p>
                    <strong>Faculty:</strong>
                    ${assignment.faculty}
                </p>


                <p class="assignment-description">

                    <strong>Description:</strong>

                    ${assignment.description}

                </p>


                ${questionHTML}

                ${pdfHTML}


                <br>


                <span class="${statusClass}">

                    ${assignment.status}

                </span>


                <div class="assignment-actions">

                    <button
                        class="complete-btn"
                        onclick="
                            completeAssignment(
                                ${assignment.id}
                            )
                        "
                    >

                        ✓ Mark Completed

                    </button>


                    <button
                        class="delete-btn"
                        onclick="
                            deleteAssignment(
                                ${assignment.id}
                            )
                        "
                    >

                        🗑 Delete

                    </button>

                </div>

            `;


            list.appendChild(card);

        }
    );


    updateDashboard();

}


// ========================================
// COMPLETE ASSIGNMENT
// ========================================

function completeAssignment(id) {

    assignments =
        assignments.map(
            function(assignment) {

                if (
                    assignment.id === id
                ) {

                    assignment.status =
                        "Completed";

                }

                return assignment;

            }
        );


    saveAssignments();

    displayAssignments();

}


// ========================================
// DELETE ASSIGNMENT
// ========================================

function deleteAssignment(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this assignment?"
        );


    if (!confirmDelete) {

        return;

    }


    assignments =
        assignments.filter(
            function(assignment) {

                return assignment.id !== id;

            }
        );


    saveAssignments();

    displayAssignments();

}


// ========================================
// SEARCH
// ========================================

document
    .getElementById("search")
    .addEventListener(
        "input",
        function() {

            displayAssignments(
                this.value
            );

        }
    );


// ========================================
// DASHBOARD
// ========================================

function updateDashboard() {

    const total =
        assignments.length;


    const completed =
        assignments.filter(
            function(assignment) {

                return (
                    assignment.status ===
                    "Completed"
                );

            }
        ).length;


    const pending =
        total - completed;


    let questionCount = 0;


    assignments.forEach(
        function(assignment) {

            if (
                assignment.questions
            ) {

                questionCount +=
                    assignment.questions.length;

            }

        }
    );


    document.getElementById(
        "totalAssignments"
    ).textContent = total;


    document.getElementById(
        "pendingAssignments"
    ).textContent = pending;


    document.getElementById(
        "completedAssignments"
    ).textContent = completed;


    document.getElementById(
        "totalQuestions"
    ).textContent =
        questionCount;

}


// ========================================
// INITIAL LOAD
// ========================================

displayAssignments();
