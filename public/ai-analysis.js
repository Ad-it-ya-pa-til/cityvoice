/**
 * AI Complaint Analysis - Google Gemini Integration
 * CityVoice Platform
 */

// DOM Elements
const apiKeyInput = document.getElementById('apiKeyInput');
const complaintText = document.getElementById('complaintText');
const analyzeButton = document.getElementById('analyzeButton');
const loader = document.getElementById('loader');
const resultsSection = document.getElementById('resultsSection');
const errorMessage = document.getElementById('errorMessage');
const charCount = document.getElementById('charCount');
const toggleKeyVisibility = document.getElementById('toggleKeyVisibility');
const aiSummary = document.getElementById('aiSummary');
const aiCategory = document.getElementById('aiCategory');
const aiSeverity = document.getElementById('aiSeverity');
const useResultsButton = document.getElementById('useResultsButton');
const analyzeAgainButton = document.getElementById('analyzeAgainButton');

// Gemini API Configuration
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
const MODEL_NAME = 'gemini-2.0-flash-exp';

// System Prompt for AI
const SYSTEM_INSTRUCTION = {
  parts: [{
    text: "You are an expert municipal operations assistant for CityVoice. Your job is to analyze citizen complaints and provide a structured JSON response. Analyze the complaint text and provide: 1) A concise, professional summary/title (max 100 characters), 2) The most appropriate category from the given options, 3) The severity level based on urgency and impact. Only return the JSON object, no additional text."
  }]
};

// JSON Schema for structured response
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "A concise, professional title/summary of the complaint"
    },
    category: {
      type: "string",
      enum: ["Roads", "Sanitation", "Street Lights", "Water", "Others"],
      description: "The most appropriate category for this complaint"
    },
    severity: {
      type: "string",
      enum: ["Low", "Medium", "High"],
      description: "The urgency/severity level of the complaint"
    }
  },
  required: ["summary", "category", "severity"]
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Load saved API key from localStorage
  const savedApiKey = localStorage.getItem('gemini_api_key');
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
  }

  setupEventListeners();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Analyze button click
  analyzeButton.addEventListener('click', handleAnalysis);

  // Enter key in textarea
  complaintText.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleAnalysis();
    }
  });

  // Character counter
  complaintText.addEventListener('input', updateCharCount);

  // Toggle API key visibility
  toggleKeyVisibility.addEventListener('click', toggleApiKeyVisibility);

  // Save API key to localStorage when changed
  apiKeyInput.addEventListener('blur', () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    }
  });

  // Action buttons
  useResultsButton.addEventListener('click', useResults);
  analyzeAgainButton.addEventListener('click', resetAnalysis);
}

/**
 * Update character count
 */
function updateCharCount() {
  const count = complaintText.value.length;
  charCount.textContent = count;
}

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility() {
  const type = apiKeyInput.type === 'password' ? 'text' : 'password';
  apiKeyInput.type = type;
  toggleKeyVisibility.textContent = type === 'password' ? '👁️' : '🙈';
}

/**
 * Main analysis handler
 */
async function handleAnalysis() {
  // Get values
  const apiKey = apiKeyInput.value.trim();
  const complaint = complaintText.value.trim();

  // Hide previous error and results
  hideError();
  hideResults();

  // Validate inputs
  if (!apiKey) {
    showError('⚠️ Please enter your Google AI Studio API Key');
    apiKeyInput.focus();
    return;
  }

  if (!complaint) {
    showError('⚠️ Please enter your complaint description');
    complaintText.focus();
    return;
  }

  if (complaint.length < 20) {
    showError('⚠️ Please provide more details (at least 20 characters)');
    complaintText.focus();
    return;
  }

  // Show loading
  showLoading();
  disableButton();

  try {
    // Call Gemini API
    const result = await callGeminiAPI(apiKey, complaint);
    
    // Display results
    displayResults(result);
    
  } catch (error) {
    console.error('Analysis error:', error);
    hideLoading();
    showError(getErrorMessage(error));
  } finally {
    enableButton();
  }
}

/**
 * Call Google Gemini API
 */
async function callGeminiAPI(apiKey, complaintText) {
  const url = `${GEMINI_API_URL}?key=${apiKey}`;

  const requestBody = {
    system_instruction: SYSTEM_INSTRUCTION,
    contents: [{
      parts: [{
        text: `Analyze this civic complaint and provide structured analysis:\n\n${complaintText}`
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  };

  console.log('Calling Gemini API...');
  console.log('Request:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API Error:', errorData);
    throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('API Response:', data);

  // Extract the JSON response from Gemini
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid API response structure');
  }

  const textResponse = data.candidates[0].content.parts[0].text;
  console.log('Text Response:', textResponse);

  // Parse the JSON response
  try {
    const analysisResult = JSON.parse(textResponse);
    return analysisResult;
  } catch (parseError) {
    console.error('JSON Parse Error:', parseError);
    throw new Error('Failed to parse AI response');
  }
}

/**
 * Display analysis results
 */
function displayResults(result) {
  hideLoading();

  // Set summary
  aiSummary.textContent = result.summary || 'No summary provided';

  // Set category with styling
  aiCategory.textContent = result.category || 'Others';
  aiCategory.className = 'result-value result-badge';
  aiCategory.classList.add(`category-${result.category.toLowerCase().replace(/\s+/g, '-')}`);

  // Set severity with styling
  aiSeverity.textContent = result.severity || 'Medium';
  aiSeverity.className = 'result-value result-badge';
  aiSeverity.classList.add(`severity-${result.severity.toLowerCase()}`);

  // Show results section
  showResults();

  // Store results for "Use Results" button
  window.aiAnalysisResults = result;
}

/**
 * Use AI results (redirect to complaint form)
 */
function useResults() {
  if (!window.aiAnalysisResults) return;

  const { summary, category, severity } = window.aiAnalysisResults;
  
  // Store in sessionStorage for complaint form to use
  sessionStorage.setItem('ai_suggestion', JSON.stringify({
    title: summary,
    category: category,
    severity: severity,
    description: complaintText.value.trim()
  }));

  // Redirect to complaint form
  window.location.href = '/complaint.html';
}

/**
 * Reset for new analysis
 */
function resetAnalysis() {
  hideResults();
  complaintText.value = '';
  updateCharCount();
  complaintText.focus();
}

/**
 * Show loading indicator
 */
function showLoading() {
  loader.style.display = 'block';
  loader.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  loader.style.display = 'none';
}

/**
 * Show results section
 */
function showResults() {
  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Hide results section
 */
function hideResults() {
  resultsSection.style.display = 'none';
}

/**
 * Show error message
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Hide error message
 */
function hideError() {
  errorMessage.style.display = 'none';
}

/**
 * Disable analyze button
 */
function disableButton() {
  analyzeButton.disabled = true;
  analyzeButton.style.opacity = '0.6';
  analyzeButton.style.cursor = 'not-allowed';
}

/**
 * Enable analyze button
 */
function enableButton() {
  analyzeButton.disabled = false;
  analyzeButton.style.opacity = '1';
  analyzeButton.style.cursor = 'pointer';
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error) {
  const message = error.message || '';
  
  if (message.includes('API key')) {
    return '❌ Invalid API key. Please check your Google AI Studio API key.';
  }
  
  if (message.includes('429') || message.includes('quota')) {
    return '❌ API quota exceeded. Please try again later or check your API limits.';
  }
  
  if (message.includes('400')) {
    return '❌ Bad request. Please check your input and try again.';
  }
  
  if (message.includes('401') || message.includes('403')) {
    return '❌ Authentication failed. Please verify your API key.';
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return '❌ Network error. Please check your internet connection.';
  }
  
  return `❌ Analysis failed: ${message}`;
}

// Keyboard shortcut hint
console.log('💡 Tip: Press Ctrl+Enter in the textarea to analyze quickly!');
