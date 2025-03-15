document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('save');
    const githubTokenInput = document.getElementById('github-token');
    const geminiKeyInput = document.getElementById('gemini-key');
    const statusDiv = document.getElementById('status');
    
    // Load existing settings
    chrome.storage.sync.get(['githubToken', 'geminiKey'], function(items) {
      if (items.githubToken) githubTokenInput.value = items.githubToken;
      if (items.geminiKey) geminiKeyInput.value = items.geminiKey;
    });
    
    saveButton.addEventListener('click', function() {
      const githubToken = githubTokenInput.value.trim();
      const geminiKey = geminiKeyInput.value.trim();
      
      // Validate inputs
      if (!githubToken || !geminiKey) {
        showStatus('Please enter both API keys.', 'error');
        return;
      }
      
      // Save to Chrome storage
      chrome.storage.sync.set({
        githubToken: githubToken,
        geminiKey: geminiKey
      }, function() {
        showStatus('Settings saved successfully!', 'success');
      });
    });
    
    function showStatus(message, type) {
      statusDiv.textContent = message;
      statusDiv.className = 'status ' + type;
      statusDiv.style.display = 'block';
      
      setTimeout(function() {
        statusDiv.style.display = 'none';
      }, 3000);
    }
  });
  