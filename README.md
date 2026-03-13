# BM Job Search Extension

## Project Description
BM Job Search Extension is a Chrome extension designed to enhance your job searching experience by aggregating listings from various job boards. This tool helps you find the best opportunities without constantly switching between websites.

## Features
- Aggregate job listings from multiple sites.
- Apply filters based on job type, location, and salary.
- User-friendly interface for easy navigation.

## Installation Instructions
### Normal Use
1. Download the latest release from the [releases page](https://github.com/Bikash-Mainali/BM-Job-Search-Extension/releases).
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" by toggling the switch in the top right.
4. Click on "Load unpacked" and select the downloaded extension folder.
5. The extension will be added to your Chrome browser.

### Development Setup
1. Clone the repository:  
   `git clone https://github.com/Bikash-Mainali/BM-Job-Search-Extension.git`
2. Navigate into the project directory:  
   `cd BM-Job-Search-Extension`
3. Install any dependencies if applicable (this step depends on the project's requirements).
4. Open Chrome and go to `chrome://extensions/`.
5. Enable "Developer mode" and click on "Load unpacked".
6. Select the project folder to load it as an extension.

## Usage Guide
1. Click on the extension icon in your Chrome toolbar.
2. Use the search bar to enter job titles or keywords.
3. Apply filters based on your preferences.
4. Browse through the listings and click on any job to view more details or application options.

## File Structure
- `manifest.json` - Metadata for the extension.
- `background.js` - Script for background processes.
- `popup.html` - HTML for the popup interface.
- `content.js` - Script for manipulating content on job sites.
- `styles.css` - Styles for the extension interface.

## Troubleshooting Tips
- If the extension isn't working, ensure it's enabled in the `chrome://extensions/` page.
- Check for any updates to the extension.
- If you encounter specific errors, consult the issue tracker on GitHub for solutions or open a new issue for assistance.
