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
const registerForm = document.getElementById("registerForm");
const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const showLoginBtn = document.getElementById("showLoginBtn");

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

let currentFaculty = null;
let extractedText = "";
let generatedPaper = null;
let selectedFileName = "";
let generatedFromFile = null;
let isGenerating = false;


/* =========================================
   4. LOCAL STORAGE HELPERS
========================================= */

function getSessionKey() {
    return "gtuAssignmentSession";
}

function getAssignmentKey() {
    return "gtuAssignments";
}

function getAccountsKey() {
    return "gtuFacultyAccounts";
}

function getAccounts() {
    const accounts = readStorage(getAccountsKey(), []);
    return Array.isArray(accounts) ? accounts : [];
}

async function hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error("Secure password hashing is unavailable. Please run this app on localhost or HTTPS.");
    }

    const encoded = new TextEncoder().encode(password);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", encoded);

    return Array.from(new Uint8Array(hashBuffer))
        .map(function (byte) {
            return byte.toString(16).padStart(2, "0");
        })
        .join("");
}

function showAuthForm(formToShow) {
    loginForm.classList.toggle("hidden", formToShow !== "login");
    registerForm.classList.toggle("hidden", formToShow !== "register");

    showMessage(loginMessage, "", "");
    showMessage(registerMessage, "", "");
}

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

function getAllAssignments() {
    const assignments = readStorage(
        getAssignmentKey(),
        []
    );

    return Array.isArray(assignments)
        ? assignments
        : [];
}

function getMyAssignments() {
    if (!currentFaculty) {
        return [];
    }

    return getAllAssignments().filter(function (assignment) {
        return assignment.facultyEmail === currentFaculty.email;
    });
}


/* =========================================
   5. REGISTRATION AND LOGIN
========================================= */

showRegisterBtn.addEventListener("click", function () {
    showAuthForm("register");
});

showLoginBtn.addEventListener("click", function () {
    showAuthForm("login");
});

registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const loginId = document.getElementById("registerLoginId").value.trim().toLowerCase();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("registerConfirmPassword").value;
    const subject = document.getElementById("registerSubject").value;

    if (name.length < 2 || loginId.length < 4 || !email || password.length < 6 || !subject) {
        showMessage(registerMessage, "Please complete all fields correctly. Password must contain at least 6 characters.", "error");
        return;
    }

    if (password !== confirmPassword) {
        showMessage(registerMessage, "Passwords do not match. Please try again.", "error");
        return;
    }

    const accounts = getAccounts();

    const loginIdExists = accounts.some(function (account) {
        return account.loginId.toLowerCase() === loginId;
    });

    const emailExists = accounts.some(function (account) {
        return account.email.toLowerCase() === email;
    });

    if (loginIdExists) {
        showMessage(registerMessage, "This Login ID is already registered. Please choose another one.", "error");
        return;
    }

    if (emailExists) {
        showMessage(registerMessage, "This email is already registered. Please sign in with your existing account.", "error");
        return;
    }

    try {
        const passwordHash = await hashPassword(password);

        accounts.push({
            name: name,
            loginId: loginId,
            email: email,
            subject: subject,
            passwordHash: passwordHash
        });

        if (!writeStorage(getAccountsKey(), accounts)) return;

        registerForm.reset();

        showAuthForm("login");

        document.getElementById("loginId").value = loginId;

        showMessage(
            loginMessage,
            "Account created successfully. Please sign in with your new Login ID and password.",
            "success"
        );

    } catch (error) {
        console.error("Registration error:", error);

        showMessage(
            registerMessage,
            error.message || "Could not create your account. Please try again.",
            "error"
        );
    }
});


loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const loginId = document.getElementById("loginId").value.trim().toLowerCase();
    const password = document.getElementById("facultyPassword").value;

    if (!loginId || !password) {
        showMessage(loginMessage, "Enter your Login ID and password.", "error");
        return;
    }

    const account = getAccounts().find(function (item) {
        return item.loginId.toLowerCase() === loginId;
    });

    if (!account) {
        showMessage(loginMessage, "Account not found. Please create an account first.", "error");
        return;
    }

    try {
        const passwordHash = await hashPassword(password);

        if (passwordHash !== account.passwordHash) {
            showMessage(loginMessage, "Incorrect password. Please try again.", "error");
            return;
        }

        currentFaculty = {
            name: account.name,
            loginId: account.loginId,
            email: account.email,
            subject: account.subject
        };

        if (!writeStorage(getSessionKey(), currentFaculty)) {
            currentFaculty = null;
            return;
        }

        loginForm.reset();

        showApplication();

    } catch (error) {
        console.error("Login error:", error);

        showMessage(
            loginMessage,
            error.message || "Unable to sign in. Please try again.",
            "error"
        );
    }
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

    document.getElementById("sidebarFaculty").textContent =
        currentFaculty.name;

    document.getElementById("facultyAvatar").textContent =
        currentFaculty.name.charAt(0).toUpperCase();

    document.getElementById("welcomeHeading").textContent =
        "Welcome back, " + currentFaculty.name + "!";

    document.getElementById("topbarSubject").textContent =
        currentFaculty.subject;

    document.getElementById("facultyName").value =
        currentFaculty.name;

    document.getElementById("subject").value =
        currentFaculty.subject;

    renderDashboard();

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

    document
        .querySelectorAll(".nav-link")
        .forEach(function (link) {

            link.classList.toggle(
                "active",
                link.dataset.section === sectionId
            );

        });

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


document
    .querySelectorAll(".nav-link")
    .forEach(function (link) {

        link.addEventListener("click", function (event) {

            event.preventDefault();

            showSection(link.dataset.section);

        });

    });


document
    .querySelectorAll("[data-go]")
    .forEach(function (button) {

        button.addEventListener("click", function () {

            showSection(button.dataset.go);

        });

    });


document
    .querySelectorAll("[data-subject]")
    .forEach(function (button) {

        button.addEventListener("click", function () {

            const subject = button.dataset.subject;

            document.getElementById("subject").value =
                subject;

            const loginSubject = document.getElementById("loginSubject");

            if (loginSubject) {
                loginSubject.value = subject;
            }

            showSection("create");

        });

    });


/* =========================================
   10. FILE SELECTION
========================================= */

chapterFile.addEventListener("change", function () {

    const file = chapterFile.files[0];

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

    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        PDF_WORKER_URL;

    return window.pdfjsLib;
}


/* =========================================
   12. EXTRACT TEXT FROM PDF
========================================= */

async function extractPDFText(file) {

    const pdfjsLib = await loadPDFLibrary();

    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer
    });

    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {

        const page = await pdf.getPage(pageNumber);

        const textContent = await page.getTextContent();

        const pageText = textContent.items
            .map(function (item) {
                return item.str;
            })
            .join(" ");

        fullText += "\n" + pageText;
    }

    return fullText.trim();
}


/* =========================================
   13. CLEAN EXTRACTED TEXT
========================================= */

function cleanExtractedText(text) {

    return String(text || "")
        .replace(/\s+/g, " ")
        .replace(/[^\w\s.,;:!?()[\]{}%+\-/]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}


/* =========================================
   14. SPLIT TEXT INTO SENTENCES
========================================= */

function splitIntoSentences(text) {

    const cleanedText = cleanExtractedText(text);

    return cleanedText
        .split(/(?<=[.!?])\s+/)
        .map(function (sentence) {
            return sentence.trim();
        })
        .filter(function (sentence) {
            return sentence.length > 25;
        });
}


/* =========================================
   15. EXTRACT KEYWORDS
========================================= */

function extractKeywords(text) {

    const stopWords = [
        "about", "above", "after", "again", "against",
        "also", "among", "because", "before", "being",
        "below", "between", "both", "could", "does",
        "doing", "during", "each", "from", "further",
        "have", "having", "here", "into", "itself",
        "more", "most", "other", "over", "same",
        "should", "some", "such", "than", "that",
        "their", "them", "then", "there", "these",
        "they", "this", "those", "through", "under",
        "until", "very", "what", "when", "where",
        "which", "while", "with", "would", "your",
        "the", "and", "for", "are", "was", "were",
        "you", "has", "had", "can", "will", "its",
        "not", "but", "all", "any", "our", "out",
        "use", "used", "using", "one", "two", "three"
    ];

    const words = cleanExtractedText(text)
        .toLowerCase()
        .match(/[a-z][a-z0-9-]{3,}/g) || [];

    const frequency = {};

    words.forEach(function (word) {

        if (stopWords.includes(word)) {
            return;
        }

        frequency[word] = (frequency[word] || 0) + 1;

    });

    return Object.keys(frequency)
        .sort(function (a, b) {
            return frequency[b] - frequency[a];
        })
        .slice(0, 30);
}


/* =========================================
   16. GET IMPORTANT SENTENCES
========================================= */

function getImportantSentences(text, limit) {

    const sentences = splitIntoSentences(text);

    const keywords = extractKeywords(text);

    const scoredSentences = sentences.map(function (sentence) {

        const lowerSentence = sentence.toLowerCase();

        let score = 0;

        keywords.forEach(function (keyword) {

            if (lowerSentence.includes(keyword)) {
                score++;
            }

        });

        return {
            sentence: sentence,
            score: score
        };

    });

    scoredSentences.sort(function (a, b) {
        return b.score - a.score;
    });

    return scoredSentences
        .slice(0, limit)
        .map(function (item) {
            return item.sentence;
        });
}


/* =========================================
   17. CREATE SHORT QUESTION
========================================= */

function createShortQuestion(sentence, index) {

    const cleanedSentence = sentence
        .replace(/[.!?]+$/, "")
        .trim();

    const templates = [
        "Define and explain: " + cleanedSentence + ".",
        "What do you understand by " + cleanedSentence + "?",
        "Write a short note on " + cleanedSentence + ".",
        "Explain the meaning of " + cleanedSentence + ".",
        "State the important points related to " + cleanedSentence + "."
    ];

    return templates[index % templates.length];
}


/* =========================================
   18. CREATE MEDIUM QUESTION
========================================= */

function createMediumQuestion(sentence, index) {

    const cleanedSentence = sentence
        .replace(/[.!?]+$/, "")
        .trim();

    const templates = [
        "Explain " + cleanedSentence + " with a suitable example.",
        "Describe the concept of " + cleanedSentence + " in detail.",
        "Discuss the important features of " + cleanedSentence + ".",
        "Explain the working and importance of " + cleanedSentence + ".",
        "Write a detailed note on " + cleanedSentence + "."
    ];

    return templates[index % templates.length];
}


/* =========================================
   19. CREATE LONG QUESTION
========================================= */

function createLongQuestion(sentence, index) {

    const cleanedSentence = sentence
        .replace(/[.!?]+$/, "")
        .trim();

    const templates = [
        "Explain " + cleanedSentence + " in detail with a neat diagram and suitable example.",
        "Discuss " + cleanedSentence + ". Explain its types, features and applications.",
        "Describe the complete concept of " + cleanedSentence + " with its advantages and limitations.",
        "Explain the working, structure and importance of " + cleanedSentence + " in detail.",
        "Write a detailed explanation of " + cleanedSentence + " with suitable examples."
    ];

    return templates[index % templates.length];
}


/* =========================================
   20. GENERATE QUESTION PAPER
========================================= */

function generateQuestionPaper(text) {

    const sentences = splitIntoSentences(text);

    if (sentences.length < 3) {
        throw new Error(
            "Not enough readable text was found in this PDF. Please upload a text-based PDF with more chapter content."
        );
    }

    const importantSentences = getImportantSentences(
        text,
        25
    );

    const sourceSentences = importantSentences.length >= 10
        ? importantSentences
        : sentences;

    const shortQuestions = [];
    const mediumQuestions = [];
    const longQuestions = [];

    for (let i = 0; i < 10; i++) {

        const sentence = sourceSentences[
            i % sourceSentences.length
        ];

        shortQuestions.push(
            createShortQuestion(sentence, i)
        );
    }

    for (let i = 0; i < 5; i++) {

        const sentence = sourceSentences[
            (i + 10) % sourceSentences.length
        ];

        mediumQuestions.push(
            createMediumQuestion(sentence, i)
        );
    }

    for (let i = 0; i < 5; i++) {

        const sentence = sourceSentences[
            (i + 15) % sourceSentences.length
        ];

        longQuestions.push(
            createLongQuestion(sentence, i)
        );
    }

    return {
        shortQuestions: shortQuestions,
        mediumQuestions: mediumQuestions,
        longQuestions: longQuestions,
        totalMarks: 70
    };
}


/* =========================================
   21. FORMAT QUESTION PAPER
========================================= */

function formatQuestionPaper(paper) {

    let output = "";

    output += "GTU ASSIGNMENT QUESTION PAPER\n";
    output += "========================================\n\n";

    output += "Q.1 Answer the following questions. (10 × 1 = 10 Marks)\n\n";

    paper.shortQuestions.forEach(function (question, index) {
        output += (index + 1) + ". " + question + " (1 Mark)\n";
    });

    output += "\n\nQ.2 Answer the following questions. (5 × 5 = 25 Marks)\n\n";

    paper.mediumQuestions.forEach(function (question, index) {
        output += (index + 1) + ". " + question + " (5 Marks)\n";
    });

    output += "\n\nQ.3 Answer the following questions. (5 × 7 = 35 Marks)\n\n";

    paper.longQuestions.forEach(function (question, index) {
        output += (index + 1) + ". " + question + " (7 Marks)\n";
    });

    output += "\n\n========================================\n";
    output += "TOTAL MARKS: 70\n";

    return output;
}


/* =========================================
   22. GENERATE QUESTIONS FROM PDF
========================================= */

generateBtn.addEventListener("click", async function () {

    if (isGenerating) {
        return;
    }

    const file = chapterFile.files[0];

    if (!file) {

        showMessage(
            generationStatus,
            "Please select a PDF file first.",
            "error"
        );

        return;
    }

    const facultyName = document.getElementById("facultyName").value.trim();
    const program = document.getElementById("program").value;
    const semester = document.getElementById("semester").value;
    const subject = document.getElementById("subject").value;
    const chapter = document.getElementById("chapter").value.trim();
    const title = document.getElementById("assignmentTitle").value.trim();

    if (!facultyName || !program || !semester || !subject || !chapter || !title) {

        showMessage(
            generationStatus,
            "Please complete all assignment information before generating questions.",
            "error"
        );

        return;
    }

    isGenerating = true;

    generateBtn.disabled = true;

    generateBtn.textContent = "⏳ Generating Questions...";

    showMessage(
        generationStatus,
        "Reading PDF and preparing questions. Please wait...",
        "success"
    );

    try {

        extractedText = await extractPDFText(file);

        if (!extractedText || extractedText.length < 100) {

            throw new Error(
                "Very little text was found in the PDF. Please use a text-based PDF."
            );

        }

        generatedPaper = generateQuestionPaper(
            extractedText
        );

        generatedFromFile = file.name;

        selectedFileName = file.name;

        questionsTextarea.value =
            formatQuestionPaper(generatedPaper);

        displayQuestionGroups(generatedPaper);

        questionPreview.classList.remove("hidden");

        showMessage(
            generationStatus,
            "Questions generated successfully! Review them before saving.",
            "success"
        );

        questionPreview.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {

        console.error("Question generation error:", error);

        showMessage(
            generationStatus,
            error.message || "Could not generate questions. Please try again.",
            "error"
        );

    } finally {

        isGenerating = false;

        generateBtn.disabled = false;

        generateBtn.textContent = "✨ Generate 70 Marks Questions";

    }

});


/* =========================================
   23. DISPLAY GENERATED QUESTION GROUPS
========================================= */

function displayQuestionGroups(paper) {

    questionGroups.replaceChildren();

    const groups = [
        {
            title: "Section A — 1 Mark Questions",
            questions: paper.shortQuestions,
            marks: "10 Marks"
        },
        {
            title: "Section B — 5 Mark Questions",
            questions: paper.mediumQuestions,
            marks: "25 Marks"
        },
        {
            title: "Section C — 7 Mark Questions",
            questions: paper.longQuestions,
            marks: "35 Marks"
        }
    ];

    groups.forEach(function (group) {

        const groupElement = document.createElement("div");

        groupElement.className = "question-group";

        const heading = document.createElement("h3");

        heading.textContent =
            group.title + " (" + group.marks + ")";

        groupElement.appendChild(heading);

        const list = document.createElement("ol");

        group.questions.forEach(function (question) {

            const item = document.createElement("li");

            item.textContent = question;

            list.appendChild(item);

        });

        groupElement.appendChild(list);

        questionGroups.appendChild(groupElement);

    });

    document.getElementById("previewMarks").textContent =
        paper.totalMarks;

}


/* =========================================
   24. REGENERATE QUESTIONS
========================================= */

regenerateBtn.addEventListener("click", function () {

    if (!extractedText) {

        showMessage(
            generationStatus,
            "Please upload and read a PDF first.",
            "error"
        );

        return;
    }

    try {

        generatedPaper = generateQuestionPaper(
            extractedText
        );

        questionsTextarea.value =
            formatQuestionPaper(generatedPaper);

        displayQuestionGroups(generatedPaper);

        showMessage(
            generationStatus,
            "A new question set has been generated.",
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

    if (!generatedPaper || !questionsTextarea.value.trim()) {

        showMessage(
            generationStatus,
            "Generate the question paper before saving.",
            "error"
        );

        return;
    }

    const assignment = {

        id: Date.now().toString(),

        facultyName: document
            .getElementById("facultyName")
            .value.trim(),

        facultyEmail: currentFaculty.email,

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
            .value.trim(),

        title: document
            .getElementById("assignmentTitle")
            .value.trim(),

        dueDate: document
            .getElementById("dueDate")
            .value,

        description: document
            .getElementById("description")
            .value.trim(),

        fileName: selectedFileName,

        questions: questionsTextarea.value.trim(),

        totalMarks: 70,

        createdAt: new Date().toISOString()

    };

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

    assignmentForm.reset();

    renderDashboard();

    renderAssignments();

    showSection("assignments");

});


/* =========================================
   26. DASHBOARD STATISTICS
========================================= */

function renderDashboard() {

    const assignments = getMyAssignments();

    const totalAssignments = assignments.length;

    const pdfAssignments = assignments.filter(
        function (assignment) {
            return Boolean(assignment.fileName);
        }
    ).length;

    const totalQuestions = assignments.reduce(
        function (total, assignment) {

            const questionCount = String(
                assignment.questions || ""
            )
                .split("\n")
                .filter(function (line) {
                    return /^\s*\d+\./.test(line);
                })
                .length;

            return total + questionCount;

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
   27. RENDER RECENT ASSIGNMENTS
========================================= */

function renderRecentAssignments(assignments) {

    recentAssignments.replaceChildren();

    if (!assignments.length) {

        const empty = document.createElement("div");

        empty.className = "empty-state";

        empty.textContent =
            "No assignments yet. Create your first assignment!";

        recentAssignments.appendChild(empty);

        return;
    }

    assignments.slice(0, 4).forEach(function (assignment) {

        const card = document.createElement("div");

        card.className = "recent-item";

        const info = document.createElement("div");

        info.className = "recent-info";

        const title = document.createElement("strong");

        title.textContent = assignment.title;

        const detail = document.createElement("small");

        detail.textContent =
            assignment.subject + " • " + assignment.chapter;

        info.appendChild(title);
        info.appendChild(detail);

        const date = document.createElement("span");

        date.className = "recent-date";

        date.textContent = formatDate(assignment.createdAt);

        card.appendChild(info);
        card.appendChild(date);

        recentAssignments.appendChild(card);

    });

}


/* =========================================
   28. FORMAT DATE
========================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "Date not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Date not available";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


/* =========================================
   29. RENDER ASSIGNMENT LIST
========================================= */

function renderAssignments() {

    if (!currentFaculty) {
        return;
    }

    const assignments = getMyAssignments();

    const searchTerm = searchInput.value
        .trim()
        .toLowerCase();

    const selectedSubject = filterSubject.value;

    const filteredAssignments = assignments.filter(
        function (assignment) {

            const searchableText = [
                assignment.title,
                assignment.subject,
                assignment.chapter,
                assignment.program,
                assignment.semester
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                searchableText.includes(searchTerm);

            const matchesSubject =
                !selectedSubject ||
                assignment.subject === selectedSubject;

            return matchesSearch && matchesSubject;

        }
    );

    assignmentList.replaceChildren();

    if (!filteredAssignments.length) {

        const empty = document.createElement("div");

        empty.className = "empty-state";

        empty.textContent = assignments.length
            ? "No assignments match your search."
            : "No assignments found. Create your first assignment!";

        assignmentList.appendChild(empty);

        return;
    }

    filteredAssignments.forEach(function (assignment) {

        const card = createAssignmentCard(assignment);

        assignmentList.appendChild(card);

    });

}


/* =========================================
   30. CREATE ASSIGNMENT CARD
========================================= */

function createAssignmentCard(assignment) {

    const card = document.createElement("article");

    card.className = "assignment-card";

    const header = document.createElement("div");

    header.className = "assignment-card-header";

    const titleArea = document.createElement("div");

    const title = document.createElement("h3");

    title.textContent = assignment.title;

    const subject = document.createElement("span");

    subject.className = "assignment-subject";

    subject.textContent = assignment.subject;

    titleArea.appendChild(title);
    titleArea.appendChild(subject);

    const marks = document.createElement("span");

    marks.className = "assignment-marks";

    marks.textContent =
        assignment.totalMarks + " Marks";

    header.appendChild(titleArea);
    header.appendChild(marks);

    const details = document.createElement("div");

    details.className = "assignment-details";

    const detailItems = [
        ["Program", assignment.program],
        ["Semester", assignment.semester],
        ["Chapter", assignment.chapter],
        ["Submission", formatDate(assignment.dueDate)],
        ["Created", formatDate(assignment.createdAt)],
        ["PDF", assignment.fileName || "Not attached"]
    ];

    detailItems.forEach(function (item) {

        const detail = document.createElement("div");

        detail.className = "detail-item";

        const label = document.createElement("small");

        label.textContent = item[0];

        const value = document.createElement("strong");

        value.textContent = item[1] || "Not specified";

        detail.appendChild(label);
        detail.appendChild(value);

        details.appendChild(detail);

    });

    const actions = document.createElement("div");

    actions.className = "assignment-actions";

    const viewButton = document.createElement("button");

    viewButton.type = "button";
    viewButton.className = "secondary-btn";
    viewButton.textContent = "View Questions";

    viewButton.addEventListener("click", function () {
        showSavedQuestions(assignment);
    });

    const printButton = document.createElement("button");

    printButton.type = "button";
    printButton.className = "secondary-btn";
    printButton.textContent = "Print";

    printButton.addEventListener("click", function () {
        printAssignment(assignment);
    });

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", function () {
        deleteAssignment(assignment.id);
    });

    actions.appendChild(viewButton);
    actions.appendChild(printButton);
    actions.appendChild(deleteButton);

    card.appendChild(header);
    card.appendChild(details);
    card.appendChild(actions);

    return card;

}


/* =========================================
   31. SEARCH ASSIGNMENTS
========================================= */

searchInput.addEventListener("input", function () {

    renderAssignments();

});


/* =========================================
   32. FILTER ASSIGNMENTS
========================================= */

filterSubject.addEventListener("change", function () {

    renderAssignments();

});


/* =========================================
   33. REFRESH ASSIGNMENTS
========================================= */

document.addEventListener("visibilitychange", function () {

    if (!document.hidden && currentFaculty) {
        renderAssignments();
        renderDashboard();
    }

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

    extractedText = "";

    generatedPaper = null;

    generatedFromFile = null;

    selectedFileName = "";

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
