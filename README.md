### Frappe Developer Tools

A suite of tools for Frappe developers, featuring an AI-powered chat interface powered by Google Generative AI (Gemini API).

## Features

- **AI Chat Interface**: ChatGPT-like interface for querying Gemini API
- **NLP Query Preprocessing**: Intelligent query preprocessing for better LLM understanding
- **Chat History**: Store and retrieve previous conversations
- **DocType Integration**: Seamless integration with Frappe's DocType system
- **Token Usage Tracking**: Monitor API token consumption

## Installation

You can install this app using the [bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app https://github.com/jagadeesandev/frappe-developer-tools --branch develop
bench install-app frappe_developer_tools
```

## Configuration

### Setting up Gemini API Key

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. In Frappe, navigate to **Frappe Developer Tools Settings**
3. Paste your API key in the **Gemini API Key** field
4. Save the settings

## Usage

### Accessing the Chat Interface

Navigate to `/ai-chat` in your Frappe instance to access the chat interface.

### API Endpoints

#### Send Chat Message
```
Method: frappe_developer_tools.gemini_utils.send_chat_message
Parameters:
  - chat_id: "new" or existing chat ID
  - message: User message text
Returns:
  - success: Boolean
  - chat_id: Chat session ID
  - response: AI response text
  - chat: Full chat document
```

#### Get Chat History
```
Method: frappe_developer_tools.gemini_utils.get_chat_history
Parameters:
  - chat_id: Chat ID
Returns:
  - success: Boolean
  - chat: Chat document with all messages
```

## Architecture

### Backend Components

1. **AI Chat DocType** - Main document for storing chat sessions
2. **AI Chat Message** - Child table for individual messages
3. **Frappe Developer Tools Settings** - Singleton for API configuration
4. **gemini_utils.py** - Core Gemini API integration and NLP preprocessing

### Frontend Components

1. **ai_chat.html** - Chat interface template
2. **ai_chat.py** - Page controller for context setup
3. **Integrated CSS/JS** - Responsive UI with real-time messaging

## NLP Features

The app includes query preprocessing to improve LLM understanding:

- Removes extra whitespace and normalizes input
- Removes common filler words for cleaner processing
- Converts queries to lowercase for consistent processing

## Development

### Running Tests

```bash
cd $PATH_TO_YOUR_BENCH
bench --site [site-name] test-site
```

### Building Assets

```bash
bench build --app frappe_developer_tools
```

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/frappe_developer_tools
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade
### CI

This app can use GitHub Actions for CI. The following workflows are configured:

- CI: Installs this app and runs unit tests on every push to `develop` branch.
- Linters: Runs [Frappe Semgrep Rules](https://github.com/frappe/semgrep-rules) and [pip-audit](https://pypi.org/project/pip-audit/) on every pull request.


### License

mit
