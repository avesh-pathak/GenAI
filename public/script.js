// Application state
const appState = {
    currentAnalysis: null,
    currentDocumentText: '',
    currentDocumentName: ''
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeUpload();
    initializeChat();
    initializeComparison();
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
            appState.currentAnalysis = result.analysis;
            appState.currentDocumentText = result.documentText || ''; // Store the document text for chat
            appState.currentDocumentName = file.name;
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
    const summaryElement = document.getElementById('documentSummary');
    summaryElement.innerHTML = highlightLegalTerms(analysis.summary);

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
        li.innerHTML = highlightLegalTerms(point);
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
            <div class="original">
                <p>"${highlightLegalTerms(clause.original)}"</p>
                <button class="copy-btn" data-copy="${clause.original}">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
            <div class="simplified">
                <p>${highlightLegalTerms(clause.simplified)}</p>
                <button class="copy-btn" data-copy="${clause.simplified}">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
        `;
        simplifiedClauses.appendChild(clauseDiv);
    });

    // Add event listeners to copy buttons
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const textToCopy = e.currentTarget.dataset.copy;
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Optional: show a notification that text was copied
                e.currentTarget.querySelector('i').className = 'fas fa-check';
                setTimeout(() => {
                    e.currentTarget.querySelector('i').className = 'fas fa-copy';
                }, 2000);
            });
        });
    });

    // Update recommendations
    const recommendations = document.getElementById('recommendations');
    recommendations.innerHTML = '';
    analysis.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.innerHTML = highlightLegalTerms(rec);
        recommendations.appendChild(li);
    });

    // Add tooltip listeners for legal terms
    document.querySelectorAll('.legal-term').forEach(term => {
        term.addEventListener('mouseenter', showTooltip);
        term.addEventListener('mouseleave', hideTooltip);
    });

    // Show results section
    document.getElementById('results-section').style.display = 'block';
    
    // Scroll to results
    document.getElementById('results-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function highlightLegalTerms(text) {
    if (!text) return '';
    let highlightedText = text;
    for (const term in legalGlossary) {
        const regex = new RegExp(`\\b(${term})\\b`, 'gi');
        highlightedText = highlightedText.replace(regex, `<span class="legal-term" data-definition="${legalGlossary[term]}">$1</span>`);
    }
    return highlightedText;
}

function showTooltip(event) {
    const term = event.target;
    const definition = term.dataset.definition;
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = definition;
    document.body.appendChild(tooltip);

    const termRect = term.getBoundingClientRect();
    tooltip.style.left = `${termRect.left}px`;
    tooltip.style.top = `${termRect.bottom + 5}px`;
}

function hideTooltip(event) {
    const tooltips = document.querySelectorAll('.tooltip');
    tooltips.forEach(tooltip => tooltip.remove());
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
        hasAnalysis: !!appState.currentAnalysis,
        hasDocumentText: !!appState.currentDocumentText,
        documentName: appState.currentDocumentName
    });

    if (!question) {
        alert('Please enter a question');
        return;
    }

    if (!appState.currentAnalysis) {
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
            hasDocumentText: !!appState.currentDocumentText,
            hasAnalysis: !!appState.currentAnalysis
        });

        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: question,
                documentText: appState.currentDocumentText || '',
                analysis: appState.currentAnalysis || {}
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

    // Sanitize and format the message
    let formattedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // Basic sanitization

    // Bold, Italic, and Strikethrough
    formattedMessage = formattedMessage.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedMessage = formattedMessage.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formattedMessage = formattedMessage.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // Unordered lists
    formattedMessage = formattedMessage.replace(/^\s*[-*]\s/gm, '</li><li>');
    if (formattedMessage.includes('</li><li>')) {
        formattedMessage = '<ul><li>' + formattedMessage.replace('</li><li>', '') + '</li></ul>';
    }
    
    // Line breaks
    formattedMessage = formattedMessage.replace(/\n/g, '<br>');

    // Check for long messages and add a "Show more" button
    const maxLength = 300; // Character limit
    if (formattedMessage.length > maxLength) {
        const shortText = formattedMessage.substring(0, maxLength);
        const longText = formattedMessage.substring(maxLength);
        messageDiv.innerHTML = `
            <div class="message-content">
                ${shortText}<span class="more-text" style="display:none;">${longText}</span>
                <button class="show-more-btn">Show more</button>
            </div>
        `;

        const showMoreBtn = messageDiv.querySelector('.show-more-btn');
        showMoreBtn.addEventListener('click', () => {
            const moreText = messageDiv.querySelector('.more-text');
            if (moreText.style.display === 'none') {
                moreText.style.display = 'inline';
                showMoreBtn.textContent = 'Show less';
            } else {
                moreText.style.display = 'none';
                showMoreBtn.textContent = 'Show more';
            }
        });
    } else {
        messageDiv.innerHTML = `<div class="message-content">${formattedMessage}</div>`;
    }

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

    appState.currentAnalysis = demoAnalysis;
    appState.currentDocumentText = "This is a demo rental agreement. The tenant shall pay rent of $2,500 per month on the first day of each month. A security deposit of $2,500 is required. The lease term is 12 months starting January 1, 2024. Late fees of $50 apply if rent is paid after the 5th of the month. No pets are allowed without written permission. The tenant is responsible for electricity and internet utilities. The landlord is responsible for major repairs.";
    appState.currentDocumentName = "Demo Rental Agreement.pdf";
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

// Comparison functionality
function initializeComparison() {
    const comparisonUploadArea1 = document.getElementById('comparisonUploadArea1');
    const comparisonDocumentInput1 = document.getElementById('comparisonDocumentInput1');
    const comparisonUploadArea2 = document.getElementById('comparisonUploadArea2');
    const comparisonDocumentInput2 = document.getElementById('comparisonDocumentInput2');
    const compareButton = document.getElementById('compare-button');

    let file1 = null;
    let file2 = null;

    // Click to upload
    comparisonUploadArea1.addEventListener('click', () => {
        comparisonDocumentInput1.click();
    });
    comparisonUploadArea2.addEventListener('click', () => {
        comparisonDocumentInput2.click();
    });

    // File input change
    comparisonDocumentInput1.addEventListener('change', (e) => {
        file1 = handleComparisonFileUpload(e, comparisonUploadArea1);
    });
    comparisonDocumentInput2.addEventListener('change', (e) => {
        file2 = handleComparisonFileUpload(e, comparisonUploadArea2);
    });

    // Drag and drop
    [comparisonUploadArea1, comparisonUploadArea2].forEach((uploadArea, index) => {
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
                if (index === 0) {
                    file1 = handleComparisonFileUpload({ target: { files: files } }, uploadArea);
                } else {
                    file2 = handleComparisonFileUpload({ target: { files: files } }, uploadArea);
                }
            }
        });
    });

    compareButton.addEventListener('click', () => {
        if (file1 && file2) {
            compareDocuments(file1, file2);
        } else {
            alert('Please select two documents to compare.');
        }
    });
}

function handleComparisonFileUpload(event, uploadArea) {
    const file = event.target.files[0];
    if (!file) return null;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'];

    if (!allowedTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, DOCX, or TXT file.');
        return null;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return null;
    }

    // Update UI to show file name
    const uploadContent = uploadArea.querySelector('.upload-content');
    uploadContent.innerHTML = `
        <i class="fas fa-file-check"></i>
        <h3>${file.name}</h3>
        <p>Ready to compare</p>
    `;

    return file;
}

async function compareDocuments(file1, file2) {
    const formData = new FormData();
    formData.append('document1', file1);
    formData.append('document2', file2);

    // Show loading overlay
    showLoadingOverlay();

    try {
        const response = await fetch('/api/compare', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            displayComparisonResults(result);
        } else {
            throw new Error(result.error || 'Comparison failed');
        }

    } catch (error) {
        console.error('Comparison error:', error);
        alert('Failed to compare documents: ' + error.message);
    } finally {
        hideLoadingOverlay();
    }
}

function displayComparisonResults(result) {
    // Create a new section for the results
    const comparisonResultsSection = document.createElement('section');
    comparisonResultsSection.id = 'comparison-results-section';
    comparisonResultsSection.className = 'results-section';

    const { documents, comparison } = result;

    let comparisonHTML = `
        <div class="container">
            <div class="results-header">
                <h2>Comparison Results</h2>
            </div>
            <div class="results-grid">
                <div class="result-card">
                    <div class="card-header">
                        <h3>${documents.doc1.name}</h3>
                    </div>
                    <div class="card-content">
                        <p><strong>Summary:</strong> ${documents.doc1.analysis.summary}</p>
                        <p><strong>Overall Risk:</strong> ${documents.doc1.analysis.riskAssessment.overall}</p>
                    </div>
                </div>
                <div class="result-card">
                    <div class="card-header">
                        <h3>${documents.doc2.name}</h3>
                    </div>
                    <div class="card-content">
                        <p><strong>Summary:</strong> ${documents.doc2.analysis.summary}</p>
                        <p><strong>Overall Risk:</strong> ${documents.doc2.analysis.riskAssessment.overall}</p>
                    </div>
                </div>
            </div>
            <div class="results-grid">
                <div class="result-card">
                    <div class="card-header">
                        <h3>Key Differences</h3>
                    </div>
                    <div class="card-content">
                        <ul>
    `;

    comparison.keyDifferences.forEach(diff => {
        comparisonHTML += `<li><strong>${diff.aspect}:</strong> ${diff.impact}</li>`;
    });

    comparisonHTML += `
                        </ul>
                    </div>
                </div>
                <div class="result-card">
                    <div class="card-header">
                        <h3>Recommendations</h3>
                    </div>
                    <div class="card-content">
                        <ul>
    `;

    comparison.recommendations.forEach(rec => {
        comparisonHTML += `<li>${rec}</li>`;
    });

    comparisonHTML += `
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;

    comparisonResultsSection.innerHTML = comparisonHTML;

    // Add the new section to the page
    const mainElement = document.querySelector('body');
    mainElement.appendChild(comparisonResultsSection);

    // Scroll to the results
    comparisonResultsSection.scrollIntoView({
        behavior: 'smooth'
    });
}


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