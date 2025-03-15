document.addEventListener('DOMContentLoaded', function() {
  const searchButton = document.getElementById('search');
  const keywordInput = document.getElementById('keyword');
  const resultsDiv = document.getElementById('results');
  const settingsLink = document.getElementById('settings-link');
  
  // Settings link handler
  settingsLink.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
  
  // Search button handler
  searchButton.addEventListener('click', function() {
    const keyword = keywordInput.value.trim();
    if (keyword === '') return;
    
    resultsDiv.innerHTML = '<div class="loading">Searching...</div>';
    
    searchGitHub(keyword);
  });
  
  // Enter key handler
  keywordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchButton.click();
    }
  });
  
  // Main search function
  async function searchGitHub(keyword) {
    try {
      // Search in fastai repositories
      const fastaiResults = await searchRepository('fastai', keyword);
      
      // Search in AnswerDotAI repositories
      const answeraiResults = await searchRepository('AnswerDotAI', keyword);
      
      // Combine and display results
      displayResults(fastaiResults.concat(answeraiResults));
    } catch (error) {
      resultsDiv.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
  }
  
  // Repository search function
  async function searchRepository(org, keyword) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['githubToken'], async function(items) {
        if (!items.githubToken) {
          resultsDiv.innerHTML = '<div class="error">GitHub token not set. Please go to extension settings.</div>';
          reject(new Error('GitHub token not set'));
          return;
        }
        
        const endpoint = `https://api.github.com/search/code?q=${encodeURIComponent(keyword)}+in:file+language:python+org:${org}`;
        
        try {
          console.log(`Searching ${endpoint}`);
          
          const response = await fetch(endpoint, {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'Authorization': 'token ' + items.githubToken
            }
          });
          
          console.log(`Response status: ${response.status}`);
          
          if (!response.ok) {
            if (response.status === 403) {
              const errorData = await response.json();
              console.error('API Error:', errorData);
              throw new Error('Rate limit exceeded or authentication issue. Try again later.');
            }
            throw new Error(`GitHub API returned ${response.status}`);
          }
          
          const data = await response.json();
          resolve(await processResults(data.items || [], keyword));
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  
  // Process search results
  async function processResults(items, keyword) {
    const processedResults = [];
    
    for (const item of items.slice(0, 3)) { // Limit to 3 results per repository
      const fileUrl = item.html_url;
      const repoName = item.repository.full_name;
      
      // Get file content to extract context
      const rawUrl = item.html_url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      
      try {
        const contentResponse = await fetch(rawUrl);
        if (!contentResponse.ok) continue;
        
        const content = await contentResponse.text();
        const context = extractContext(content, keyword);
        
        if (context) {
          // Generate AI explanation
          const explanation = await generateAIExplanation(keyword, context);
          
          processedResults.push({
            repoName,
            fileUrl,
            context,
            explanation
          });
        }
      } catch (error) {
        console.error('Error processing result:', error);
      }
    }
    
    return processedResults;
  }
  
  // Extract code context
  function extractContext(content, keyword) {
    const lines = content.split('\n');
    const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'i');
    
    for (let i = 0; i < lines.length; i++) {
      if (keywordRegex.test(lines[i])) {
        // Extract a few lines before and after for context
        const startLine = Math.max(0, i - 2);
        const endLine = Math.min(lines.length - 1, i + 2);
        
        return lines.slice(startLine, endLine + 1).join('\n');
      }
    }
    
    return null;
  }

  async function generateAIExplanation(keyword, codeContext) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['geminiKey'], async function(items) {
        if (!items.geminiKey) {
          resolve('API key not set. Please go to extension settings to add your Gemini API key.');
          return;
        }
        
        // Updated to use the working model
        const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent';
        
        const prompt = `
  Python keyword/function: ${keyword}
  
  Code context from fastai/AnswerDotAI repository:
  \`\`\`python
  ${codeContext}
  \`\`\`
  
  Explain in 3-4 sentences how this Python keyword/function is being used in this code, focusing on:
  1. The purpose of this code
  2. How the keyword is used in a smart/clever way
  3. Any fastai-specific patterns or techniques demonstrated
  `;
  
        try {
          console.log("Calling Gemini API with updated model...");
          
          const response = await fetch(`${endpoint}?key=${items.geminiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 250
              }
            })
          });
          
          console.log("Gemini API response status:", response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API error:", errorText);
            throw new Error('AI explanation service error: ' + response.status);
          }
          
          const data = await response.json();
          return resolve(data.candidates[0].content.parts[0].text);
        } catch (error) {
          console.error('AI explanation error:', error);
          resolve('Could not generate explanation. Error: ' + error.message);
        }
      });
    });
  }
  

  function displayResults(results) {
    if (results.length === 0) {
      resultsDiv.innerHTML = '<div>No examples found.</div>';
      return;
    }
    
    // Sort results: code snippets first, imports later
    results.sort((a, b) => {
      const aIsImport = a.context.includes('import ');
      const bIsImport = b.context.includes('import ');
      
      if (aIsImport && !bIsImport) return 1;  // a is import, b is not -> b comes first
      if (!aIsImport && bIsImport) return -1; // a is not import, b is -> a comes first
      return 0; // both are imports or both are not imports -> keep original order
    });
    
    let html = '';
    for (const result of results) {
      html += `
        <div class="example">
          <div><strong>Repository:</strong> ${result.repoName}</div>
          <div><strong>File:</strong> <a href="${result.fileUrl}" target="_blank">${result.fileUrl.split('/').pop()}</a></div>
          <div class="code-context">
            <pre>${escapeHtml(result.context)}</pre>
          </div>
          <div class="explanation">
            <h4>AI Explanation:</h4>
            <p>${result.explanation}</p>
          </div>
        </div>
      `;
    }
    
    resultsDiv.innerHTML = html;
  }
  
  
  

  
  
  
  // Helper function to escape HTML
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Log that extension loaded
  console.log('Extension loaded successfully');
});
