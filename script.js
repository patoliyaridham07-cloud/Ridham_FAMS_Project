/* =========================================
   1. PDF.JS CONFIGURATION
========================================= */

const PDFJS_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";

const PDF_WORKER_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";


/* =========================================
   2. GET HTML ELEMENTS
========================================= */

const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

const logoutBtn = document.getElementById("logoutBtn");

const assignmentForm = document.getElementById("assignmentForm");

const chapterFile = document.getElementById("chapterFile");
const fileName = document.getElementById("fileName");

const generateBtn = document.getElementById("generateFromFile");
const regenerateBtn = document.getElementById("regenerateBtn");

const generationStatus =
    document.getElementById("generationStatus");

const questionPreview =
    document.getElementById("questionPreview");

const questionGroups =
    document.getElementById("questionGroups");

const questionsTextarea =
    document.getElementById("questions");

const assignmentList =
    document.getElementById("assignmentList");

const recentAssignments =
    document.getElementById("recentAssignments");

const searchInput =
    document.getElementById("search");

const filterSubject =
    document.getElementById("filterSubject");

const printBtn =
    document.getElementById("printBtn");


/* =========================================
   3. APPLICATION VARIABLES
========================================= */

// Current faculty information.
let currentFaculty = null;

// Extracted text from the uploaded PDF.
let extractedText = "";

// Generated question paper.
let generatedPaper = null;

// Selected PDF name.
let selectedFileName = "";

// Keep track of the PDF used for generation.
let generatedFromFile = null;

// Prevent duplicate submissions.
let isGenerating = false;


/* =========================================
   4. LOCAL STORAGE HELPERS
========================================= */

// Return the key used to store the current session.
function getSessionKey() {
    return "gtuAssignmentSession";
}

// Return the key used to store assignments.
function getAssignmentKey() {
    return "gtuAssignments";
}


// Read JSON safely from localStorage.
function readStorage(key, defaultValue) {
    try {
        const value = localStorage.getItem(key);

        if (!value) {
            return defaultValue;
        }

        return JSON.parse(value);

    } catch (error) {
        console.error("Storage reading error:", error);
        return defaultValue;
    }
}


// Save JSON safely to localStorage.
function writeStorage(key, value) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {
        console.error("Storage saving error:", error);

        alert(
            "Could not save data. Your browser storage may be full."
        );

        return false;
    }
}


// Get all assignments.
function getAllAssignments() {
    const assignments = readStorage(
        getAssignmentKey(),
        []
    );

    return Array.isArray(assignments)
        ? assignments
        : [];
}


// Get assignments belonging to the logged-in faculty.
function getMyAssignments() {
    if (!currentFaculty) {
        return [];
    }

    return getAllAssignments().filter(function (assignment) {
        return assignment.facultyEmail === currentFaculty.email;
    });
}


/* =========================================
   5. LOGIN FUNCTIONALITY
========================================= */

loginForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const facultyName = document
        .getElementById("facultyLogin")
        .value.trim();

    const facultyEmail = document
        .getElementById("facultyEmail")
        .value.trim()
        .toLowerCase();

    const password = document
        .getElementById("facultyPassword")
        .value;

    const subject = document
        .getElementById("loginSubject")
        .value;

    // Basic validation.
    if (
        facultyName.length < 2 ||
        !facultyEmail ||
        password.length < 4 ||
        !subject
    ) {
        showMessage(
            loginMessage,
            "Please enter valid login details.",
            "error"
        );

        return;
    }

    // This is a demo login, not secure authentication.
    currentFaculty = {
        name: facultyName,
        email: facultyEmail,
        subject: subject
    };

    // Store the demo session.
    const sessionSaved = writeStorage(
        getSessionKey(),
        currentFaculty
    );

    if (!sessionSaved) {
        currentFaculty = null;
        return;
    }

    showApplication();

    loginForm.reset();

});


/* =========================================
   6. DISPLAY APPLICATION
========================================= */

function showApplication() {

    if (!currentFaculty) {
        return;
    }

    loginPage.classList.add("hidden");
    appPage.classList.remove("hidden");

    // Update faculty information.
    document.getElementById("sidebarFaculty").textContent =
        currentFaculty.name;

    document.getElementById("facultyAvatar").textContent =
        currentFaculty.name.charAt(0).toUpperCase();

    document.getElementById("welcomeHeading").textContent =
        "Welcome back, " + currentFaculty.name + "!";

    document.getElementById("topbarSubject").textContent =
        currentFaculty.subject;

    // Fill the form with faculty details.
    document.getElementById("facultyName").value =
        currentFaculty.name;

    document.getElementById("subject").value =
        currentFaculty.subject;

    // Refresh dashboard.
    renderDashboard();

    // Show dashboard initially.
    showSection("dashboard");
}


/* =========================================
   7. LOGOUT
========================================= */

logoutBtn.addEventListener("click", function () {

    currentFaculty = null;

    try {
        localStorage.removeItem(getSessionKey());
    } catch (error) {
        console.error(error);
    }

    // Clear temporary data.
    extractedText = "";
    generatedPaper = null;
    generatedFromFile = null;
    selectedFileName = "";

    assignmentForm.reset();

    questionPreview.classList.add("hidden");

    loginPage.classList.remove("hidden");
    appPage.classList.add("hidden");

    showMessage(loginMessage, "", "");

});


/* =========================================
   8. RESTORE SESSION AFTER REFRESH
========================================= */

function restoreSession() {

    const savedSession = readStorage(
        getSessionKey(),
        null
    );

    if (
        savedSession &&
        savedSession.name &&
        savedSession.email &&
        savedSession.subject
    ) {
        currentFaculty = savedSession;

        showApplication();

    } else {

        loginPage.classList.remove("hidden");
        appPage.classList.add("hidden");

    }
}


/* =========================================
   9. NAVIGATION
========================================= */

function showSection(sectionId) {

    const allowedSections = [
        "dashboard",
        "create",
        "assignments"
    ];

    if (!allowedSections.includes(sectionId)) {
        sectionId = "dashboard";
    }

    document
        .querySelectorAll(".content-section")
        .forEach(function (section) {

            section.classList.add("hidden");

        });

    document
        .getElementById(sectionId)
        .classList.remove("hidden");

    // Update active navigation.
    document
        .querySelectorAll(".nav-link")
        .forEach(function (link) {

            link.classList.toggle(
                "active",
                link.dataset.section === sectionId
            );

        });

    // Refresh assignments when opening the list.
    if (sectionId === "assignments") {
        renderAssignments();
    }

    if (sectionId === "dashboard") {
        renderDashboard();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// Sidebar navigation.
document
    .querySelectorAll(".nav-link")
    .forEach(function (link) {

        link.addEventListener("click", function (event) {

            event.preventDefault();

            showSection(link.dataset.section);

        });

    });


// Dashboard buttons that navigate to another section.
document
    .querySelectorAll("[data-go]")
    .forEach(function (button) {

        button.addEventListener("click", function () {

            showSection(button.dataset.go);

        });

    });


// Subject cards.
document
    .querySelectorAll("[data-subject]")
    .forEach(function (button) {

        button.addEventListener("click", function () {

            const subject = button.dataset.subject;

            document.getElementById("subject").value =
                subject;

            document.getElementById("loginSubject").value =
                subject;

            showSection("create");

        });

    });


/* =========================================
   10. FILE SELECTION
========================================= */

chapterFile.addEventListener("change", function () {

    const file = chapterFile.files[0];

    // Clear previous PDF information.
    extractedText = "";
    generatedPaper = null;
    generatedFromFile = null;

    questionPreview.classList.add("hidden");

    if (!file) {

        selectedFileName = "";
        fileName.textContent = "No file selected";

        showMessage(
            generationStatus,
            "",
            ""
        );

        return;
    }

    // Accept PDF files only.
    const isPDF =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

    if (!isPDF) {

        chapterFile.value = "";

        selectedFileName = "";

        fileName.textContent = "No file selected";

        showMessage(
            generationStatus,
            "Please upload a PDF file.",
            "error"
        );

        return;
    }

    // File size limit: 15 MB.
    const maximumSize = 15 * 1024 * 1024;

    if (file.size > maximumSize) {

        chapterFile.value = "";

        selectedFileName = "";

        fileName.textContent = "No file selected";

        showMessage(
            generationStatus,
            "The PDF must be smaller than 15 MB.",
            "error"
        );

        return;
    }

    selectedFileName = file.name;

    fileName.textContent =
        "Selected: " + file.name;

    showMessage(
        generationStatus,
        "PDF selected. Click Generate 70 Marks Questions.",
        "success"
    );

});


/* =========================================
   11. LOAD PDF.JS
========================================= */

async function loadPDFLibrary() {

    if (window.pdfjsLib) {
        return window.pdfjsLib;
    }

    // Load PDF.js dynamically if it has not loaded.
    await new Promise(function (resolve, reject) {

        const existingScript = document.querySelector(
            'script[src="' + PDFJS_URL + '"]'
        );

        if (existingScript) {

            existingScript.addEventListener(
                "load",
                resolve,
                { once: true }
            );

            existingScript.addEventListener(
                "error",
                reject,
                { once: true }
            );

            return;
        }

        const script = document.createElement("script");

        script.src = PDFJS_URL;

        script.onload = resolve;

        script.onerror = reject;

        document.head.appendChild(script);

    });

    if (!window.pdfjsLib) {
        throw new Error("PDF.js could not be loaded.");
    }

    return window.pdfjsLib;
}


/* =========================================
   12. EXTRACT TEXT FROM PDF
========================================= */

async function extractPDFText(file) {

    const pdfjsLib = await loadPDFLibrary();

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        PDF_WORKER_URL;

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer)
    }).promise;

    let fullText = "";

    const maximumPages = Math.min(pdf.numPages, 100);

    // Read each page.
    for (
        let pageNumber = 1;
        pageNumber <= maximumPages;
        pageNumber++
    ) {

        showMessage(
            generationStatus,
            "Reading PDF page " +
                pageNumber +
                " of " +
                maximumPages +
                "...",
            "info"
        );

        const page = await pdf.getPage(pageNumber);

        const textContent = await page.getTextContent();

        const pageText = textContent.items
            .filter(function (item) {
                return typeof item.str === "string";
            })
            .map(function (item) {
                return item.str;
            })
            .join(" ");

        fullText += "\n" + pageText;
    }

    fullText = fullText
        .replace(/\s+/g, " ")
        .trim();

    if (fullText.length < 100) {

        throw new Error(
            "Not enough readable text was found. " +
            "Your PDF may be scanned or image-based. " +
            "Use a text-based PDF or OCR to extract its text."
        );

    }

    return fullText;
}


/* =========================================
   13. CLEAN EXTRACTED TEXT
========================================= */

function cleanText(text) {

    return text
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


/* =========================================
   14. SPLIT TEXT INTO SENTENCES
========================================= */

function splitIntoSentences(text) {

    const cleanedText = cleanText(text);

    // Split on sentence endings and common PDF line separators.
    let sentences = cleanedText
        .split(/(?<=[.!?])\s+|(?<=;)\s+/);

    sentences = sentences
        .map(function (sentence) {

            return sentence
                .replace(/^[\s•\-–]+/, "")
                .trim();

        })
        .filter(function (sentence) {

            return (
                sentence.length >= 20 &&
                sentence.length <= 650 &&
                /[a-zA-Z]/.test(sentence)
            );

        });

    // Remove duplicate sentences.
    return [...new Set(sentences)];
}


/* =========================================
   15. FIND IMPORTANT SENTENCES
========================================= */

function rankSentences(sentences) {

    const keywords = [
        "definition",
        "define",
        "concept",
        "important",
        "advantages",
        "disadvantages",
        "characteristics",
        "features",
        "types",
        "classification",
        "difference",
        "compare",
        "working",
        "process",
        "method",
        "algorithm",
        "architecture",
        "structure",
        "implementation",
        "function",
        "management",
        "system",
        "example",
        "application",
        "purpose",
        "principle",
        "mechanism",
        "components",
        "steps",
        "operation",
        "memory",
        "network",
        "database",
        "security"
    ];

    return sentences
        .map(function (sentence, index) {

            let score = 0;

            const lowerSentence = sentence.toLowerCase();

            keywords.forEach(function (keyword) {

                if (lowerSentence.includes(keyword)) {
                    score += 2;
                }

            });

            // Prefer sentences with useful explanatory detail.
            if (sentence.length > 55) {
                score += 1;
            }

            if (sentence.length > 100) {
                score += 1;
            }

            // Slightly penalize extremely long sentences.
            if (sentence.length > 300) {
                score -= 2;
            }

            return {
                sentence: sentence,
                score: score,
                originalIndex: index
            };

        })
        .sort(function (a, b) {

            if (b.score !== a.score) {
                return b.score - a.score;
            }

            return a.originalIndex - b.originalIndex;

        })
        .map(function (item) {

            return item.sentence;

        });
}


/* =========================================
   16. GET A SOURCE SENTENCE
========================================= */

function getSourceSentence(sentences, index) {

    if (!sentences.length) {
        return "";
    }

    return sentences[index % sentences.length];
}


/* =========================================
   17. CREATE 1-MARK QUESTIONS
========================================= */

function createOneMarkQuestion(sentence, index) {

    const patterns = [

        function (text) {
            return "Define the key concept discussed in: " + text;
        },

        function (text) {
            return "What is the main idea explained in: " + text;
        },

        function (text) {
            return "State the meaning of the concept described in: " + text;
        },

        function (text) {
            return "Identify the important concept in: " + text;
        },

        function (text) {
            return "State one important fact explained in: " + text;
        }

    ];

    const pattern = patterns[index % patterns.length];

    return pattern(sentence);
}


/* =========================================
   18. CREATE 5-MARK QUESTIONS
========================================= */

function createFiveMarkQuestion(sentence, index) {

    const patterns = [

        function (text) {
            return "Explain the concept described below with a suitable example: " + text;
        },

        function (text) {
            return "Describe the important features of the concept discussed in: " + text;
        },

        function (text) {
            return "Explain the working or process described in: " + text;
        },

        function (text) {
            return "Discuss the main points and applications related to: " + text;
        },

        function (text) {
            return "Explain the significance of the following concept: " + text;
        }

    ];

    return patterns[index % patterns.length](sentence);
}


/* =========================================
   19. CREATE 7-MARK QUESTIONS
========================================= */

function createSevenMarkQuestion(sentence, index) {

    const patterns = [

        function (text) {
            return "Explain the concept in detail with its working, a suitable example and a diagram where applicable: " + text;
        },

        function (text) {
            return "Discuss the concept in detail. Explain its features, applications and limitations: " + text;
        },

        function (text) {
            return "Describe the process step by step, with an example and a suitable diagram where applicable: " + text;
        },

        function (text) {
            return "Explain the principle, working and practical applications of the concept described in: " + text;
        },

        function (text) {
            return "Write a detailed note on the following topic, including its components, working and advantages: " + text;
        }

    ];

    return patterns[index % patterns.length](sentence);
}


/* =========================================
   20. GENERATE EXACTLY 70 MARKS
========================================= */

/*
    Question Paper Pattern:

    Section A:
    10 questions × 1 mark = 10 marks

    Section B:
    5 questions × 5 marks = 25 marks

    Section C:
    5 questions × 7 marks = 35 marks

    Total = 70 marks
*/

function generateQuestionPaper(text) {

    const sentences = splitIntoSentences(text);

    if (sentences.length < 5) {

        throw new Error(
            "The PDF contains too little readable text. " +
            "Please upload a more detailed chapter PDF."
        );

    }

    const rankedSentences = rankSentences(sentences);

    const oneMarkQuestions = [];

    const fiveMarkQuestions = [];

    const sevenMarkQuestions = [];


    // Generate 10 questions of 1 mark each.
    for (let i = 0; i < 10; i++) {

        const sentence = getSourceSentence(
            rankedSentences,
            i
        );

        oneMarkQuestions.push({
            question: createOneMarkQuestion(sentence, i),
            marks: 1
        });

    }


    // Generate 5 questions of 5 marks each.
    for (let i = 0; i < 5; i++) {

        const sentence = getSourceSentence(
            rankedSentences,
            10 + i
        );

        fiveMarkQuestions.push({
            question: createFiveMarkQuestion(sentence, i),
            marks: 5
        });

    }


    // Generate 5 questions of 7 marks each.
    for (let i = 0; i < 5; i++) {

        const sentence = getSourceSentence(
            rankedSentences,
            15 + i
        );

        sevenMarkQuestions.push({
            question: createSevenMarkQuestion(sentence, i),
            marks: 7
        });

    }


    return {
        oneMark: oneMarkQuestions,
        fiveMark: fiveMarkQuestions,
        sevenMark: sevenMarkQuestions,
        totalMarks: 70,
        sourceSentences: rankedSentences
    };
}


/* =========================================
   21. FORMAT QUESTIONS AS TEXT
========================================= */

function formatQuestionsAsText(paper) {

    let output = "";

    output += "SECTION A: SHORT QUESTIONS\n";
    output += "10 Questions × 1 Mark = 10 Marks\n\n";

    paper.oneMark.forEach(function (item, index) {

        output +=
            (index + 1) +
            ". " +
            item.question +
            " [" +
            item.marks +
            " Mark]\n";

    });


    output += "\nSECTION B: MEDIUM QUESTIONS\n";
    output += "5 Questions × 5 Marks = 25 Marks\n\n";

    paper.fiveMark.forEach(function (item, index) {

        output +=
            (index + 11) +
            ". " +
            item.question +
            " [" +
            item.marks +
            " Marks]\n";

    });


    output += "\nSECTION C: LONG QUESTIONS\n";
    output += "5 Questions × 7 Marks = 35 Marks\n\n";

    paper.sevenMark.forEach(function (item, index) {

        output +=
            (index + 16) +
            ". " +
            item.question +
            " [" +
            item.marks +
            " Marks]\n";

    });


    output += "\nTOTAL MARKS: 70\n";

    return output;
}


/* =========================================
   22. DISPLAY QUESTION PREVIEW
========================================= */

function renderQuestionPreview(paper) {

    questionGroups.replaceChildren();

    // Section A.
    renderQuestionGroup(
        "SECTION A — SHORT QUESTIONS",
        "10 Questions × 1 Mark = 10 Marks",
        paper.oneMark
    );

    // Section B.
    renderQuestionGroup(
        "SECTION B — MEDIUM QUESTIONS",
        "5 Questions × 5 Marks = 25 Marks",
        paper.fiveMark
    );

    // Section C.
    renderQuestionGroup(
        "SECTION C — LONG QUESTIONS",
        "5 Questions × 7 Marks = 35 Marks",
        paper.sevenMark
    );

    document.getElementById("previewMarks").textContent =
        paper.totalMarks;

    questionsTextarea.value =
        formatQuestionsAsText(paper);

    questionPreview.classList.remove("hidden");
}


// Build a question section safely using textContent.
function renderQuestionGroup(title, subtitle, questions) {

    const section = document.createElement("div");

    section.className = "question-group";

    const heading = document.createElement("h3");

    heading.textContent = title;

    section.appendChild(heading);

    const description = document.createElement("p");

    description.textContent = subtitle;

    description.style.fontSize = "12px";
    description.style.color = "#8589a3";
    description.style.marginBottom = "12px";

    section.appendChild(description);

    const list = document.createElement("ol");

    questions.forEach(function (item) {

        const listItem = document.createElement("li");

        listItem.textContent = item.question + " ";

        const marks = document.createElement("span");

        marks.className = "question-mark";

        marks.textContent =
            "(" + item.marks + " marks)";

        listItem.appendChild(marks);

        list.appendChild(listItem);

    });

    section.appendChild(list);

    questionGroups.appendChild(section);
}


/* =========================================
   23. GENERATE QUESTIONS BUTTON
========================================= */

generateBtn.addEventListener("click", async function () {

    if (isGenerating) {
        return;
    }

    const file = chapterFile.files[0];

    if (!file) {

        showMessage(
            generationStatus,
            "Please upload your chapter PDF first.",
            "error"
        );

        chapterFile.focus();

        return;
    }

    const subject = document
        .getElementById("subject")
        .value;

    const chapter = document
        .getElementById("chapter")
        .value.trim();

    if (!subject || !chapter) {

        showMessage(
            generationStatus,
            "Please select a subject and enter the chapter name.",
            "error"
        );

        return;
    }

    isGenerating = true;

    generateBtn.disabled = true;

    generateBtn.textContent = "⏳ Reading PDF...";

    try {

        // Read the PDF.
        extractedText = await extractPDFText(file);

        showMessage(
            generationStatus,
            "PDF text extracted. Preparing questions...",
            "info"
        );

        // Generate questions from extracted text.
        generatedPaper = generateQuestionPaper(
            extractedText
        );

        generatedFromFile = file.name;

        selectedFileName = file.name;

        // Display the paper.
        renderQuestionPreview(generatedPaper);

        showMessage(
            generationStatus,
            "Generated 20 questions with a total of 70 marks. " +
            "Please review the questions before saving.",
            "success"
        );

    } catch (error) {

        console.error("Question generation error:", error);

        showMessage(
            generationStatus,
            error.message ||
            "Unable to generate questions. Please try another PDF.",
            "error"
        );

    } finally {

        isGenerating = false;

        generateBtn.disabled = false;

        generateBtn.textContent =
            "✨ Generate 70 Marks Questions";

    }

});


/* =========================================
   24. REGENERATE QUESTIONS
========================================= */

regenerateBtn.addEventListener("click", function () {

    if (!extractedText) {

        showMessage(
            generationStatus,
            "Upload and read a PDF first.",
            "error"
        );

        return;
    }

    try {

        // Rebuild the paper from the same PDF text.
        generatedPaper = generateQuestionPaper(
            extractedText
        );

        renderQuestionPreview(generatedPaper);

        showMessage(
            generationStatus,
            "Questions regenerated. Review them before saving.",
            "success"
        );

    } catch (error) {

        showMessage(
            generationStatus,
            error.message,
            "error"
        );

    }

});


/* =========================================
   25. SAVE ASSIGNMENT
========================================= */

assignmentForm.addEventListener("submit", function (event) {

    event.preventDefault();

    if (!currentFaculty) {

        alert("Please sign in first.");

        return;
    }

    if (!generatedPaper || !extractedText) {

        showMessage(
            generationStatus,
            "Generate questions from your PDF before saving.",
            "error"
        );

        return;
    }

    const facultyName = document
        .getElementById("facultyName")
        .value.trim();

    const program = document
        .getElementById("program")
        .value;

    const semester = document
        .getElementById("semester")
        .value;

    const subject = document
        .getElementById("subject")
        .value;

    const chapter = document
        .getElementById("chapter")
        .value.trim();

    const title = document
        .getElementById("assignmentTitle")
        .value.trim();

    const dueDate = document
        .getElementById("dueDate")
        .value;

    const description = document
        .getElementById("description")
        .value.trim();

    const questionText = questionsTextarea.value.trim();

    if (
        !facultyName ||
        !program ||
        !semester ||
        !subject ||
        !chapter ||
        !title ||
        !dueDate ||
        !questionText
    ) {

        showMessage(
            generationStatus,
            "Please complete all required fields.",
            "error"
        );

        return;
    }

    // Do not save an expired submission date.
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(
        dueDate + "T00:00:00"
    );

    if (selectedDate < today) {

        showMessage(
            generationStatus,
            "Please choose today or a future submission date.",
            "error"
        );

        return;
    }

    const assignment = {

        id: createID(),

        facultyName: facultyName,

        facultyEmail: currentFaculty.email,

        program: program,

        semester: semester,

        subject: subject,

        chapter: chapter,

        title: title,

        dueDate: dueDate,

        description: description,

        fileName: generatedFromFile || selectedFileName,

        questions: questionText,

        totalMarks: 70,

        questionCount: 20,

        createdAt: new Date().toISOString()

    };

    // Save assignment.
    const allAssignments = getAllAssignments();

    allAssignments.unshift(assignment);

    const saved = writeStorage(
        getAssignmentKey(),
        allAssignments
    );

    if (!saved) {
        return;
    }

    showMessage(
        generationStatus,
        "Assignment saved successfully!",
        "success"
    );

    alert("Assignment created and saved successfully!");

    // Reset the form.
    assignmentForm.reset();

    extractedText = "";

    generatedPaper = null;

    generatedFromFile = null;

    selectedFileName = "";

    fileName.textContent = "No file selected";

    questionPreview.classList.add("hidden");

    // Restore the faculty defaults.
    document.getElementById("facultyName").value =
        currentFaculty.name;

    document.getElementById("subject").value =
        currentFaculty.subject;

    // Update the dashboard.
    renderDashboard();

    showSection("assignments");

});


/* =========================================
   26. CREATE UNIQUE ID
========================================= */

function createID() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID === "function"
    ) {
        return window.crypto.randomUUID();
    }

    return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2)
    );
}


/* =========================================
   27. RENDER DASHBOARD
========================================= */

function renderDashboard() {

    if (!currentFaculty) {
        return;
    }

    const assignments = getMyAssignments();

    const totalAssignments = assignments.length;

    const pdfAssignments = assignments.filter(
        function (assignment) {
            return Boolean(assignment.fileName);
        }
    ).length;

    const totalQuestions = assignments.reduce(
        function (total, assignment) {

            return total + (
                Number(assignment.questionCount) || 0
            );

        },
        0
    );

    const subjects = new Set(
        assignments.map(function (assignment) {
            return assignment.subject;
        })
    );

    document.getElementById("totalAssignments").textContent =
        totalAssignments;

    document.getElementById("pdfAssignments").textContent =
        pdfAssignments;

    document.getElementById("totalQuestions").textContent =
        totalQuestions;

    document.getElementById("totalSubjects").textContent =
        subjects.size;

    renderRecentAssignments(assignments);

}


/* =========================================
   28. RECENT ASSIGNMENTS
========================================= */

function renderRecentAssignments(assignments) {

    recentAssignments.replaceChildren();

    if (!assignments.length) {

        recentAssignments.appendChild(
            createEmptyState(
                "No assignments yet. Create your first assignment!"
            )
        );

        return;
    }

    assignments.slice(0, 3).forEach(function (assignment) {

        const item = document.createElement("div");

        item.className = "recent-item";

        const details = document.createElement("div");

        const title = document.createElement("h3");

        title.textContent = assignment.title;

        const description = document.createElement("p");

        description.textContent =
            assignment.subject +
            " · " +
            assignment.chapter +
            " · " +
            assignment.totalMarks +
            " marks";

        details.append(title, description);

        const button = document.createElement("button");

        button.className = "secondary-btn";

        button.textContent = "View";

        button.type = "button";

        button.addEventListener("click", function () {

            showSection("assignments");

            // Search for the assignment by its title.
            searchInput.value = assignment.title;

            filterSubject.value = "";

            renderAssignments();

        });

        item.append(details, button);

        recentAssignments.appendChild(item);

    });

}


/* =========================================
   29. RENDER ASSIGNMENT LIST
========================================= */

function renderAssignments() {

    assignmentList.replaceChildren();

    if (!currentFaculty) {
        return;
    }

    const searchText = searchInput.value
        .trim()
        .toLowerCase();

    const selectedSubject = filterSubject.value;

    const filteredAssignments = getMyAssignments()
        .filter(function (assignment) {

            const searchableText = [

                assignment.title,
                assignment.subject,
                assignment.chapter,
                assignment.program,
                assignment.semester,
                assignment.facultyName

            ].join(" ").toLowerCase();

            const matchesSearch =
                searchableText.includes(searchText);

            const matchesSubject =
                !selectedSubject ||
                assignment.subject === selectedSubject;

            return matchesSearch && matchesSubject;

        });

    if (!filteredAssignments.length) {

        assignmentList.appendChild(
            createEmptyState(
                "No assignments found. Try another search or create an assignment."
            )
        );

        return;
    }

    filteredAssignments.forEach(function (assignment) {

        const card = document.createElement("article");

        card.className = "assignment-card";

        const badge = document.createElement("span");

        badge.className = "assignment-badge";

        badge.textContent = assignment.subject;

        const title = document.createElement("h3");

        title.textContent = assignment.title;

        const program = createParagraph(
            "Program: " + assignment.program
        );

        const semester = createParagraph(
            "Semester: " + assignment.semester
        );

        const chapter = createParagraph(
            "Chapter: " + assignment.chapter
        );

        const faculty = createParagraph(
            "Faculty: " + assignment.facultyName
        );

        const marks = createParagraph(
            "Total Marks: " + assignment.totalMarks
        );

        const dueDate = createParagraph(
            "Submission Date: " + assignment.dueDate
        );

        const file = createParagraph(
            "PDF: " + (assignment.fileName || "Not available")
        );

        const actions = document.createElement("div");

        actions.className = "card-actions";

        const viewButton = createActionButton(
            "View Questions",
            "view-btn"
        );

        const printButton = createActionButton(
            "Print / PDF",
            "print-btn"
        );

        const deleteButton = createActionButton(
            "Delete",
            "delete-btn"
        );

        viewButton.addEventListener("click", function () {

            showSavedQuestions(assignment);

        });

        printButton.addEventListener("click", function () {

            printAssignment(assignment);

        });

        deleteButton.addEventListener("click", function () {

            deleteAssignment(assignment.id);

        });

        actions.append(
            viewButton,
            printButton,
            deleteButton
        );

        card.append(
            badge,
            title,
            program,
            semester,
            chapter,
            faculty,
            marks,
            dueDate,
            file,
            actions
        );

        assignmentList.appendChild(card);

    });

}


/* =========================================
   30. CREATE PARAGRAPH
========================================= */

function createParagraph(text) {

    const paragraph = document.createElement("p");

    paragraph.textContent = text;

    return paragraph;
}


/* =========================================
   31. CREATE ACTION BUTTON
========================================= */

function createActionButton(text, className) {

    const button = document.createElement("button");

    button.type = "button";

    button.className = className;

    button.textContent = text;

    return button;
}


/* =========================================
   32. EMPTY STATE
========================================= */

function createEmptyState(message) {

    const element = document.createElement("div");

    element.className = "empty-state";

    element.textContent = message;

    return element;
}


/* =========================================
   33. SEARCH AND FILTER
========================================= */

searchInput.addEventListener("input", function () {

    renderAssignments();

});

filterSubject.addEventListener("change", function () {

    renderAssignments();

});


/* =========================================
   34. DELETE ASSIGNMENT
========================================= */

function deleteAssignment(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this assignment?"
    );

    if (!confirmed) {
        return;
    }

    const allAssignments = getAllAssignments();

    const assignment = allAssignments.find(
        function (item) {
            return item.id === id;
        }
    );

    if (
        !assignment ||
        assignment.facultyEmail !== currentFaculty.email
    ) {

        alert("Assignment not found.");

        return;
    }

    const updatedAssignments = allAssignments.filter(
        function (item) {
            return item.id !== id;
        }
    );

    const saved = writeStorage(
        getAssignmentKey(),
        updatedAssignments
    );

    if (!saved) {
        return;
    }

    renderAssignments();

    renderDashboard();

}


/* =========================================
   35. VIEW SAVED QUESTIONS
========================================= */

function showSavedQuestions(assignment) {

    const printArea = document.getElementById("printArea");

    printArea.replaceChildren();

    addPrintHeading(
        printArea,
        assignment.title
    );

    addPrintText(
        printArea,
        "Subject: " + assignment.subject
    );

    addPrintText(
        printArea,
        "Chapter: " + assignment.chapter
    );

    addPrintText(
        printArea,
        "Program: " + assignment.program
    );

    addPrintText(
        printArea,
        "Semester: " + assignment.semester
    );

    addPrintText(
        printArea,
        "Total Marks: " + assignment.totalMarks
    );

    addPrintText(
        printArea,
        "Faculty: " + assignment.facultyName
    );

    addPrintQuestions(
        printArea,
        assignment.questions
    );

    // Display the saved paper in a new window for reading.
    const paperWindow = window.open(
        "",
        "_blank",
        "width=850,height=750"
    );

    if (!paperWindow) {

        alert(
            "Your browser blocked the new window. " +
            "Allow pop-ups and try again."
        );

        return;
    }

    const printableHTML = createPrintableHTML(
        assignment
    );

    paperWindow.document.open();

    paperWindow.document.write(printableHTML);

    paperWindow.document.close();

}


/* =========================================
   36. PRINT SAVED ASSIGNMENT
========================================= */

function printAssignment(assignment) {

    const printableHTML = createPrintableHTML(
        assignment
    );

    const paperWindow = window.open(
        "",
        "_blank",
        "width=850,height=750"
    );

    if (!paperWindow) {

        alert(
            "Please allow pop-ups to print or save as PDF."
        );

        return;
    }

    paperWindow.document.open();

    paperWindow.document.write(printableHTML);

    paperWindow.document.close();

    paperWindow.addEventListener(
        "load",
        function () {

            paperWindow.focus();

            paperWindow.print();

        }
    );

}


/* =========================================
   37. CREATE PRINTABLE HTML
========================================= */

function createPrintableHTML(assignment) {

    // Escape user-provided content before using HTML.
    const escapeHTML = function (value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    };

    const lines = String(
        assignment.questions || ""
    ).split("\n");

    let questionHTML = "";

    lines.forEach(function (line) {

        const escapedLine = escapeHTML(line);

        if (!escapedLine.trim()) {

            questionHTML += "<br>";

        } else {

            questionHTML +=
                "<p>" +
                escapedLine +
                "</p>";

        }

    });

    return `
        <!DOCTYPE html>
        <html lang="en">

        <head>
            <meta charset="UTF-8">

            <title>${escapeHTML(assignment.title)}</title>

            <style>

                body {
                    font-family: Arial, sans-serif;
                    color: #111;
                    padding: 35px;
                    line-height: 1.7;
                }

                h1, h2 {
                    text-align: center;
                }

                h1 {
                    font-size: 23px;
                }

                h2 {
                    font-size: 18px;
                }

                .details {
                    margin: 25px 0;
                    padding: 15px;
                    border: 1px solid #aaa;
                }

                .questions {
                    white-space: normal;
                    overflow-wrap: anywhere;
                }

                .questions p {
                    margin: 10px 0;
                }

                button {
                    padding: 10px 18px;
                    cursor: pointer;
                }

                @media print {
                    body {
                        padding: 0;
                    }

                    button {
                        display: none;
                    }
                }

            </style>

        </head>

        <body>

            <h1>GTU ASSIGNMENT</h1>

            <h2>${escapeHTML(assignment.title)}</h2>

            <div class="details">

                <p><strong>Faculty:</strong>
                    ${escapeHTML(assignment.facultyName)}
                </p>

                <p><strong>Program:</strong>
                    ${escapeHTML(assignment.program)}
                </p>

                <p><strong>Semester:</strong>
                    ${escapeHTML(assignment.semester)}
                </p>

                <p><strong>Subject:</strong>
                    ${escapeHTML(assignment.subject)}
                </p>

                <p><strong>Chapter:</strong>
                    ${escapeHTML(assignment.chapter)}
                </p>

                <p><strong>Total Marks:</strong>
                    ${escapeHTML(assignment.totalMarks)}
                </p>

                <p><strong>Submission Date:</strong>
                    ${escapeHTML(assignment.dueDate)}
                </p>

            </div>

            <h2>QUESTION PAPER</h2>

            <div class="questions">
                ${questionHTML}
            </div>

            <br>

            <p><strong>End of Question Paper</strong></p>

            <button onclick="window.print()">
                Print / Save as PDF
            </button>

        </body>

        </html>
    `;
}


/* =========================================
   38. PRINT CURRENT GENERATED PAPER
========================================= */

printBtn.addEventListener("click", function () {

    if (!generatedPaper) {

        alert("Generate the question paper first.");

        return;
    }

    const temporaryAssignment = {

        title: document
            .getElementById("assignmentTitle")
            .value || "GTU Assignment",

        facultyName: document
            .getElementById("facultyName")
            .value,

        program: document
            .getElementById("program")
            .value,

        semester: document
            .getElementById("semester")
            .value,

        subject: document
            .getElementById("subject")
            .value,

        chapter: document
            .getElementById("chapter")
            .value,

        dueDate: document
            .getElementById("dueDate")
            .value || "Not specified",

        totalMarks: 70,

        questions: questionsTextarea.value

    };

    printAssignment(temporaryAssignment);

});


/* =========================================
   39. BUILD PRINT AREA HELPERS
========================================= */

function addPrintHeading(container, text) {

    const heading = document.createElement("h1");

    heading.textContent = text;

    container.appendChild(heading);
}


function addPrintText(container, text) {

    const paragraph = document.createElement("p");

    paragraph.textContent = text;

    container.appendChild(paragraph);
}


function addPrintQuestions(container, text) {

    const section = document.createElement("div");

    section.className = "print-section";

    String(text || "")
        .split("\n")
        .forEach(function (line) {

            const paragraph = document.createElement("p");

            paragraph.textContent = line;

            section.appendChild(paragraph);

        });

    container.appendChild(section);
}


/* =========================================
   40. RESET FORM BUTTON
========================================= */

assignmentForm.addEventListener("reset", function () {

    // Clear temporary generated data.
    extractedText = "";

    generatedPaper = null;

    generatedFromFile = null;

    selectedFileName = "";

    // Reset the question preview.
    questionPreview.classList.add("hidden");

    questionGroups.replaceChildren();

    questionsTextarea.value = "";

    fileName.textContent = "No file selected";

    showMessage(
        generationStatus,
        "",
        ""
    );

});


/* =========================================
   41. SHOW STATUS MESSAGES
========================================= */

function showMessage(element, message, type) {

    element.textContent = message;

    element.className = "message";

    if (type) {

        element.classList.add(type);

    }

}


/* =========================================
   42. INITIALIZE APPLICATION
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    restoreSession();

});
