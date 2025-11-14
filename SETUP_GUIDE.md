# Frappe Developer Tools - AI Chat Setup Guide

## Quick Start

### 1. Get Gemini API Key
- Visit: https://makersuite.google.com/app/apikey
- Create a new API key
- Copy the key

### 2. Configure Settings in Frappe
1. Open your Frappe instance
2. Search for "Frappe Developer Tools Settings"
3. Paste your API key
4. Click Save

### 3. Access Chat Interface
Navigate to: `/ai-chat` in your Frappe instance

## Features

### Chat Interface
- **Real-time Messaging**: Send messages and get instant AI responses
- **Chat History**: All conversations are automatically saved
- **New Chat**: Start fresh conversations anytime
- **Message Display**: Clean, intuitive chat layout similar to ChatGPT

### Backend Features
- **DocType Storage**: All chats stored in `AI Chat` DocType
- **Message Tracking**: Individual messages with role (user/assistant)
- **Token Counting**: Automatic tracking of API token usage
- **NLP Preprocessing**: Smart query processing before sending to API

## API Integration

### Gemini Models Supported
- gemini-pro (currently configured)

### Token Management
- Free tier: Limited tokens per day
- Token usage tracked in chat document

## File Structure

```
frappe_developer_tools/
├── doctype/
│   ├── ai_chat/                    # Main chat document
│   ├── ai_chat_message/            # Child table for messages
│   └── frappe_developer_tools_settings/  # API configuration
├── gemini_utils.py                 # Gemini API integration & NLP
├── templates/pages/
│   ├── ai_chat.html                # Chat UI template
│   └── ai_chat.py                  # Page controller
├── hooks.py                        # App configuration
└── pyproject.toml                  # Dependencies
```

## Usage Examples

### Via Python API
```python
import frappe
from frappe_developer_tools.gemini_utils import send_chat_message

# Send message to AI
result = frappe.call(
    'frappe_developer_tools.gemini_utils.send_chat_message',
    args={
        'chat_id': 'new',
        'message': 'Hello, how can you help?'
    }
)

# Check result
if result['success']:
    print(f"Chat ID: {result['chat_id']}")
    print(f"Response: {result['response']}")
```

### Via Frontend
```javascript
frappe.call({
    method: 'frappe_developer_tools.gemini_utils.send_chat_message',
    args: {
        chat_id: 'CHAT-00001',
        message: 'Your question here'
    },
    callback: function(r) {
        if (r.message.success) {
            console.log(r.message.response);
        }
    }
});
```

## Troubleshooting

### API Key Not Working
- Verify the key is correct at https://makersuite.google.com/app/apikey
- Check that the key has Generative Language API access
- Ensure the key is saved in settings

### Messages Not Saving
- Check file permissions on the database
- Verify user has permission to create AI Chat records
- Check browser console for JavaScript errors

### Slow Response Times
- This is normal for first message (initialization)
- Check internet connection
- Verify Gemini API status at https://status.cloud.google.com

## Security Notes

- API keys are stored as encrypted Password fields
- Only System Managers can modify settings
- All chats are user-specific and access-controlled
- Consider setting rate limits if deploying to production

## Performance Tips

1. **Use for Quick Queries**: Best for quick questions and interactions
2. **Token Budget**: Monitor token usage in chat list view
3. **Chat Management**: Archive old chats regularly
4. **Clear Cache**: If experiencing issues, clear browser cache

## Support & Feedback

For issues or suggestions:
- GitHub: https://github.com/jagadeesandev/frappe-developer-tools
- Report issues in GitHub Issues tab
- Check existing issues before reporting

## License

MIT License - See LICENSE file for details
