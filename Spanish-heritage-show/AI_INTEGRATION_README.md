# AI Chat Integration for Spanish Heritage 3D Explorer

## Overview

This document describes the AI chat/dialogue functionality integrated into the Spanish Heritage 3D Explorer application. The system uses Alibaba Cloud's DashScope API to provide intelligent, context-aware responses about Spanish cultural heritage sites.

## Features

### 🤖 AI Guide Roles
- **Historian**: Provides historical context, events, and cultural significance
- **Architect**: Explains building techniques, styles, and structural features  
- **Archaeologist**: Discusses archaeological findings and ancient civilizations
- **Local Guide**: Shares local legends, stories, and cultural insights

### 🌍 Multi-language Support
- Chinese (中文)
- English
- Spanish (Español)

### 🎯 Context-Aware Responses
- Monument-specific information based on current 3D model
- Interactive hotspot awareness
- Conversation history context
- User profile personalization

### 🔒 Security Features
- Input validation and sanitization
- Rate limiting (20 requests/minute, 100/hour)
- Content filtering for responses
- Session management
- Malicious input detection

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# AI Service Configuration
VITE_AI_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
VITE_AI_API_KEY=sk-07f0c7dcff654a68ad0742b2c7125044

# Application Configuration
VITE_APP_NAME=Spanish Heritage 3D Explorer
VITE_APP_VERSION=1.0.0
```

### API Configuration

The system is configured to use:
- **Base URL**: `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **API Key**: `sk-07f0c7dcff654a68ad0742b2c7125044`
- **Model**: `qwen-plus` (default)
- **Max Tokens**: 2000
- **Temperature**: 0.7

## Architecture

### Core Components

1. **AI Service (`src/services/aiService.js`)**
   - Handles API communication with DashScope
   - Manages authentication and request formatting
   - Implements error handling and retry logic

2. **AI Guide Store (`src/stores/aiGuide.js`)**
   - Manages conversation state and history
   - Handles guide role switching
   - Provides voice interaction capabilities

3. **Security Utils (`src/utils/security.js`)**
   - Input validation and sanitization
   - Rate limiting implementation
   - Content filtering
   - Session management

4. **AI Guide Chat Component (`src/components/AIGuideChat.vue`)**
   - User interface for chat interaction
   - Guide selection and language switching
   - Message display and input handling

### Data Flow

```
User Input → Security Validation → AI Service → DashScope API → Response Filtering → UI Display
```

## Usage

### Basic Chat Interaction

```javascript
import { useAIGuideStore } from './stores/aiGuide'

const aiGuideStore = useAIGuideStore()

// Ask a question
const response = await aiGuideStore.askAI("What is the historical significance of this building?")
```

### Switching Guide Roles

```javascript
// Switch to architect guide
aiGuideStore.switchGuide('architect')

// Switch language
aiGuideStore.setLanguage('en')
```

### Setting Monument Context

```javascript
// Set current monument for context-aware responses
aiGuideStore.setCurrentMonument(monumentData)

// Set specific interaction context (e.g., viewing a hotspot)
aiGuideStore.setCurrentContext(hotspotData)
```

## Security Measures

### Input Validation
- Maximum message length: 1000 characters
- Malicious content detection (XSS, SQL injection, etc.)
- Control character removal
- Whitespace normalization

### Rate Limiting
- 20 requests per minute per user
- 100 requests per hour per user
- Automatic user blocking for abuse
- Request queue management

### Content Filtering
- Response sanitization
- Inappropriate content detection
- Script tag removal
- Safety validation

## Error Handling

The system handles various error scenarios:

- **API Authentication Errors**: Invalid API key
- **Rate Limiting**: Too many requests
- **Network Errors**: Connection failures
- **Validation Errors**: Invalid input
- **Service Unavailable**: API downtime

Error messages are localized and user-friendly.

## Testing

### Running Tests

```bash
# Run AI integration tests
npm run test:ai

# Run all tests
npm run test
```

### Test Coverage

The test suite covers:
- Basic AI response functionality
- Multi-language support
- Different guide roles
- Context-aware responses
- Security validation
- Rate limiting
- Error handling
- Content filtering

## Performance Considerations

### Optimization Strategies
- Conversation history limiting (8 recent messages)
- Request deduplication
- Response caching (future enhancement)
- Lazy loading of AI components

### Memory Management
- Automatic cleanup of expired sessions
- Rate limiter entry cleanup
- Conversation history pruning

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Verify the API key in `.env` file
   - Check API key permissions

2. **Rate Limit Exceeded**
   - Wait for rate limit reset
   - Check for excessive requests

3. **Network Errors**
   - Verify internet connection
   - Check firewall settings

4. **Empty Responses**
   - Check API service status
   - Verify request formatting

### Debug Mode

Enable debug logging by setting:
```javascript
// In development mode, detailed logs are automatically enabled
console.log('AI API Request:', config);
```

## Future Enhancements

### Planned Features
- Response caching for common questions
- Voice-to-text integration
- Image analysis capabilities
- Personalized learning paths
- Offline mode support

### Performance Improvements
- Request batching
- Response streaming
- CDN integration
- Edge computing deployment

## Dependencies

### Core Dependencies
- `axios`: HTTP client for API requests
- `vue`: Frontend framework
- `pinia`: State management

### Development Dependencies
- `vite`: Build tool
- Custom test framework

## Support

For issues or questions regarding the AI integration:

1. Check the console for error messages
2. Verify environment configuration
3. Test with the integration test suite
4. Review API documentation

## License

This AI integration is part of the Spanish Heritage 3D Explorer project and follows the same licensing terms.
