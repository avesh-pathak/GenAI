// Global variables
let currentAnalysis = null;
let currentDocumentText = '';
let currentDocumentName = '';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeUpload();
    initializeChat();
    loadDocumentTemplates();

    const uploadButton = document.getElementById('upload-button');
    const documentInput = document.getElementById('documentInput');
    if(uploadButton && documentInput) {
        uploadButton.addEventListener('click', () => {
            documentInput.click();
        });
    }

    const cards = document.querySelectorAll('.result-card, .feature-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });
});

// Upload functionality
function initializeUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const documentInput = document.getElementById('documentInput');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    // Click to upload
    uploadArea.addEventListener('click', () => {
        documentInput.click();
    });

    // File input change
    documentInput.addEventListener('change', handleFileUpload);

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload({ target: { files: files } });
        }
    });
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                         'text/plain'];
    
    if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, DOCX, or TXT file.');
        return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
    }

    uploadDocument(file);
}

async function uploadDocument(file) {
    const formData = new FormData();
    formData.append('document', file);

    // Show loading overlay
    showLoadingOverlay();

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            currentAnalysis = result.analysis;
            currentDocumentText = result.documentText || ''; // Store the document text for chat
            currentDocumentName = file.name;
            displayResults(result.analysis, file.name);
        } else {
            throw new Error(result.error || 'Analysis failed');
        }

    } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to analyze document: ' + error.message);
    } finally {
        hideLoadingOverlay();
    }
}

function displayResults(analysis, fileName) {
    // Update document info
    document.getElementById('documentName').textContent = fileName;
    document.getElementById('documentType').textContent = analysis.documentType || 'Legal Document';

    // Update summary
    document.getElementById('documentSummary').textContent = analysis.summary;

    // Update risk assessment
    const riskLevel = document.getElementById('riskLevel');
    riskLevel.textContent = analysis.riskAssessment.overall.toUpperCase();
    riskLevel.className = `risk-level ${analysis.riskAssessment.overall}`;

    // Update risk categories
    const riskCategories = document.getElementById('riskCategories');
    riskCategories.innerHTML = '';
    
    Object.entries(analysis.riskAssessment.categories).forEach(([category, data]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'risk-category';
        categoryDiv.innerHTML = `
            <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
            <div class="score">${data.score}</div>
            <div class="risk-level ${data.level}">${data.level.toUpperCase()}</div>
        `;
        riskCategories.appendChild(categoryDiv);
    });

    // Update key points
    const keyPoints = document.getElementById('keyPoints');
    keyPoints.innerHTML = '';
    analysis.keyPoints.forEach(point => {
        const li = document.createElement('li');
        li.textContent = point;
        keyPoints.appendChild(li);
    });

    // Update simplified clauses
    const simplifiedClauses = document.getElementById('simplifiedClauses');
    simplifiedClauses.innerHTML = '';
    analysis.simplifiedClauses.forEach(clause => {
        const clauseDiv = document.createElement('div');
        clauseDiv.className = 'clause-item';
        clauseDiv.innerHTML = `
            <h4>${clause.category.charAt(0).toUpperCase() + clause.category.slice(1)}</h4>
            <div class="original">"${clause.original}"</div>
            <div class="simplified">${clause.simplified}</div>
        `;
        simplifiedClauses.appendChild(clauseDiv);
    });

    // Update recommendations
    const recommendations = document.getElementById('recommendations');
    recommendations.innerHTML = '';
    analysis.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.textContent = rec;
        recommendations.appendChild(li);
    });

    // Show results section
    document.getElementById('results-section').style.display = 'block';
    
    // Scroll to results
    document.getElementById('results-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Chat functionality
function initializeChat() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');

    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const question = chatInput.value.trim();

    console.log('💬 Chat attempt:', {
        question: question,
        hasAnalysis: !!currentAnalysis,
        hasDocumentText: !!currentDocumentText,
        documentName: currentDocumentName
    });

    if (!question) {
        alert('Please enter a question');
        return;
    }

    if (!currentAnalysis) {
        alert('Please upload and analyze a document first');
        return;
    }

    // Add user message to chat
    addMessageToChat('user', question);
    chatInput.value = '';

    // Show typing indicator
    const typingId = addTypingIndicator();

    try {
        console.log('📤 Sending chat request:', {
            question: question,
            hasDocumentText: !!currentDocumentText,
            hasAnalysis: !!currentAnalysis
        });

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: question,
                documentText: currentDocumentText || '',
                analysis: currentAnalysis || {}
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        if (result.success) {
            // Display the main answer
            addMessageToChat('assistant', result.answer);
            
            // Add confidence indicator
            if (result.confidence) {
                addConfidenceIndicator(result.confidence);
            }
            
            // Add key insights if available
            if (result.keyInsights && result.keyInsights.length > 0) {
                setTimeout(() => {
                    addKeyInsights(result.keyInsights);
                }, 500);
            }
            
            // Add follow-up questions if available
            if (result.followUpQuestions && result.followUpQuestions.length > 0) {
                setTimeout(() => {
                    addFollowUpQuestions(result.followUpQuestions);
                }, 1000);
            }
        } else {
            throw new Error(result.error || 'Failed to get answer');
        }

    } catch (error) {
        console.error('Chat error:', error);
        removeTypingIndicator(typingId);
        addMessageToChat('assistant', 'Sorry, I encountered an error while processing your question. Please try again.');
    }
}

function addMessageToChat(sender, message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message assistant typing-indicator';
    typingDiv.id = 'typing-' + Date.now();
    typingDiv.innerHTML = '<i class="fas fa-circle"></i><i class="fas fa-circle"></i><i class="fas fa-circle"></i>';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingDiv.id;
}

function removeTypingIndicator(id) {
    const typingDiv = document.getElementById(id);
    if (typingDiv) {
        typingDiv.remove();
    }
}

function addConfidenceIndicator(confidence) {
    const chatMessages = document.getElementById('chatMessages');
    const confidenceDiv = document.createElement('div');
    confidenceDiv.className = 'confidence-indicator';
    
    const confidenceText = confidence.charAt(0).toUpperCase() + confidence.slice(1);
    const confidenceColor = confidence === 'high' ? '#16a34a' : confidence === 'medium' ? '#d97706' : '#dc2626';
    
    confidenceDiv.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>Confidence: <strong style="color: ${confidenceColor}">${confidenceText}</strong></span>
    `;
    
    chatMessages.appendChild(confidenceDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addKeyInsights(insights) {
    const chatMessages = document.getElementById('chatMessages');
    const insightsDiv = document.createElement('div');
    insightsDiv.className = 'key-insights';
    insightsDiv.innerHTML = '<strong><i class="fas fa-lightbulb"></i> Key Insights:</strong>';
    
    const insightsList = document.createElement('ul');
    insights.forEach(insight => {
        const li = document.createElement('li');
        li.textContent = insight;
        insightsList.appendChild(li);
    });
    
    insightsDiv.appendChild(insightsList);
    chatMessages.appendChild(insightsDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addFollowUpQuestions(questions) {
    const chatMessages = document.getElementById('chatMessages');
    const questionsDiv = document.createElement('div');
    questionsDiv.className = 'follow-up-questions';
    questionsDiv.innerHTML = '<strong><i class="fas fa-question-circle"></i> You might also ask:</strong>';
    
    questions.forEach(question => {
        const questionBtn = document.createElement('button');
        questionBtn.className = 'follow-up-question';
        questionBtn.textContent = question;
        questionBtn.onclick = () => {
            document.getElementById('chatInput').value = question;
            sendMessage();
        };
        questionsDiv.appendChild(questionBtn);
    });
    
    chatMessages.appendChild(questionsDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Utility functions
function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showDemo() {
    // Create a demo document analysis
    const demoAnalysis = {
        summary: "This is a standard residential rental agreement for a 2-bedroom apartment. The lease term is 12 months with a monthly rent of $2,500.",
        documentType: "rental-agreement",
        keyPoints: [
            "Monthly rent: $2,500 due on the 1st of each month",
            "Security deposit: $2,500 (one month's rent)",
            "Lease term: 12 months starting January 1, 2024",
            "Late fee: $50 if rent is paid after the 5th of the month",
            "Pet policy: No pets allowed without written permission",
            "Utilities: Tenant responsible for electricity and internet",
            "Maintenance: Landlord responsible for major repairs"
        ],
        simplifiedClauses: [
            {
                original: "The Tenant shall pay to the Landlord the sum of Two Thousand Five Hundred Dollars ($2,500.00) per month",
                simplified: "You must pay $2,500 every month for rent",
                importance: "high",
                category: "payment"
            },
            {
                original: "In the event that the Tenant fails to pay rent when due, a late fee of Fifty Dollars ($50.00) shall be assessed",
                simplified: "If you pay rent late, you'll be charged a $50 late fee",
                importance: "medium",
                category: "penalty"
            }
        ],
        recommendations: [
            "Review the pet policy if you have pets",
            "Understand your utility responsibilities",
            "Keep records of all payments and communications",
            "Take photos of the apartment condition before moving in"
        ],
        riskAssessment: {
            overall: "low",
            categories: {
                financial: { level: "low", score: 1, risks: [] },
                legal: { level: "low", score: 1, risks: [] },
                operational: { level: "low", score: 0, risks: [] },
                privacy: { level: "low", score: 0, risks: [] }
            },
            redFlags: [],
            recommendations: []
        }
    };

    currentAnalysis = demoAnalysis;
    currentDocumentText = "This is a demo rental agreement. The tenant shall pay rent of $2,500 per month on the first day of each month. A security deposit of $2,500 is required. The lease term is 12 months starting January 1, 2024. Late fees of $50 apply if rent is paid after the 5th of the month. No pets are allowed without written permission. The tenant is responsible for electricity and internet utilities. The landlord is responsible for major repairs.";
    currentDocumentName = "Demo Rental Agreement.pdf";
    displayResults(demoAnalysis, "Demo Rental Agreement.pdf");
}

async function loadDocumentTemplates() {
    try {
        const response = await fetch('/api/templates');
        const data = await response.json();
        console.log('Document templates loaded:', data.templates);
    } catch (error) {
        console.error('Failed to load templates:', error);
    }
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});


// Add some interactive animations
document.addEventListener('scroll', () => {
    const cards = document.querySelectorAll('.result-card, .feature-card');
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }
    });
});