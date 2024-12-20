# Visual Diff Service

This service captures daily screenshots of a specified website and performs visual difference comparisons between consecutive days.

## Features

- Daily automated screenshot capture
- Visual difference detection
- Difference visualization
- Configurable viewport size
- Stores historical screenshots and diffs
- Supports multiple target website URLs

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure the service:

## Configuration

Edit the CONFIG object in `index.js` to set:
- List of target website URLs
```javascript
urls: [
  'https://example.com',
  'https://example.org',
  // Add more URLs here
],
```
- Viewport size
- Custom screenshot/diff directories (optional)

## Docker Setup

You can run this service in a Docker container:

1. Build the Docker image:
```bash
docker build -t visual-diff-service .
```

2. Run the container:
```bash
docker run -v $(pwd)/screenshots:/app/screenshots -v $(pwd)/diffs:/app/diffs visual-diff-service
```

This will mount the screenshots and diffs directories from your local machine to the container, allowing you to access the generated images.

## File Naming

Files are named using a combination of the URL's hostname, path, and date:
- Screenshots: `[hostname]_[path]_[date].png`
  Example: `www-okx-com_web3-build-docs-waas-dex-get-tokens_2024-12-20.png`
- Diff images: `[hostname]_[path]_diff_[date].png`
  Example: `www-okx-com_web3-build-docs-waas-dex-get-tokens_diff_2024-12-20.png`

## Usage

Start the service:
```bash
npm start
```

The service will:
1. Take a screenshot immediately
2. Schedule daily screenshots at midnight
3. Compare each new screenshot with the previous day's
4. Generate diff images when changes are detected

## Output

- Screenshots are saved in the `screenshots` directory
- Visual diffs are saved in the `diffs` directory
- Console logs indicate when differences are detected

## Requirements

- Node.js 16+
- Playwright's browser dependencies
