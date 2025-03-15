# FastAI Code Explorer - Chrome Extension

A Chrome extension that searches for Python keywords and functions in the fastai and AnswerDotAI GitHub repositories, then uses AI to explain how they're used in context.

## Features

- Search for any Python keyword or function across fastai and AnswerDotAI repositories
- View real code examples with surrounding context
- Get AI-powered explanations of how the code works
- Learn fastai-specific patterns and techniques
- Prioritizes meaningful code snippets over import statements

## Installation

### From Source (Development)

1. Clone this repository:
git clone https://github.com/YOUR_USERNAME/fastai-code-explorer.git

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top-right corner

4. Click "Load unpacked" and select the directory containing the extension files

5. The extension icon should appear in your Chrome toolbar

## Setup

Before using the extension, you need to configure API keys:

1. **GitHub API Token**:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate a new token with "public_repo" scope
   - Copy the token for use in the extension

2. **Gemini API Key**:
   - Go to https://ai.google.dev/
   - Create a new API key
   - Copy the key for use in the extension

3. **Configure the Extension**:
   - Click the extension icon in your Chrome toolbar
   - Click "Settings" at the bottom of the popup
   - Enter your GitHub token and Gemini API key
   - Click "Save Settings"

## Usage

1. Click the extension icon in your Chrome toolbar
2. Enter a Python keyword or function name (e.g., "itemgetter", "partial", "store_attr", "parallel")
3. Click "Search"
4. View the code examples and AI explanations

## Examples of Keywords to Search

- Python built-ins: `def`, `class`, `with`, `lambda`
- fastai-specific: `store_attr`, `patch`, `L`, `delegates`
- Data science: `tensor`, `dataloader`, `transform`

## How It Works

1. The extension searches GitHub repositories using the GitHub Code Search API
2. It extracts code context around each usage of the keyword
3. It uses Google's Gemini AI to generate explanations of how the keyword is used
4. Results are displayed with both code snippets and explanations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
 - Rohan Shravan for mentorship and guidance
- [fastai](https://github.com/fastai) for their amazing library and coding style
- [AnswerDotAI](https://github.com/AnswerDotAI) for their innovative work
- Google Gemini for powering the AI explanations
