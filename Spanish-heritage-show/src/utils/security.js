/**
 * Security utilities for AI chat functionality
 */

import { config } from '../config/env.js';

/**
 * Input validation and sanitization
 */
export class InputValidator {
  static validateMessage(message) {
    const errors = [];

    // Check message length
    if (!message || typeof message !== 'string') {
      errors.push('Message must be a non-empty string');
    } else if (message.length > config.chat.maxMessageLength) {
      errors.push(`Message too long. Maximum ${config.chat.maxMessageLength} characters allowed`);
    } else if (message.trim().length === 0) {
      errors.push('Message cannot be empty');
    }

    // Check for potentially harmful content
    if (this.containsSuspiciousContent(message)) {
      errors.push('Message contains potentially harmful content');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: this.sanitizeMessage(message)
    };
  }

  static containsSuspiciousContent(message) {
    const suspiciousPatterns = [
      // Script injection attempts
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      
      // SQL injection attempts
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      
      // Command injection attempts
      /(\b(eval|exec|system|shell_exec|passthru)\b)/gi,
      
      // Excessive special characters (potential encoding attacks)
      /[<>'"&%]{10,}/g,
      
      // Extremely long words (potential buffer overflow)
      /\b\w{200,}\b/g
    ];

    return suspiciousPatterns.some(pattern => pattern.test(message));
  }

  static sanitizeMessage(message) {
    if (!message || typeof message !== 'string') return '';

    return message
      .trim()
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, config.chat.maxMessageLength); // Enforce length limit
  }
}

/**
 * Rate limiting implementation
 */
export class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.hourlyRequests = new Map();
    this.blockedUsers = new Set();
  }

  /**
   * Check if request is allowed
   */
  isAllowed(userId = 'anonymous') {
    const now = Date.now();
    
    // Check if user is blocked
    if (this.blockedUsers.has(userId)) {
      return {
        allowed: false,
        reason: 'User temporarily blocked due to excessive requests',
        retryAfter: 300000 // 5 minutes
      };
    }

    // Clean old entries
    this.cleanOldEntries(now);

    // Check per-minute limit
    const minuteKey = `${userId}_${Math.floor(now / 60000)}`;
    const minuteCount = this.requests.get(minuteKey) || 0;
    
    if (minuteCount >= config.rateLimit.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded. Too many requests per minute.',
        retryAfter: 60000 - (now % 60000)
      };
    }

    // Check per-hour limit
    const hourKey = `${userId}_${Math.floor(now / 3600000)}`;
    const hourCount = this.hourlyRequests.get(hourKey) || 0;
    
    if (hourCount >= config.rateLimit.maxRequestsPerHour) {
      return {
        allowed: false,
        reason: 'Hourly rate limit exceeded. Please try again later.',
        retryAfter: 3600000 - (now % 3600000)
      };
    }

    // Update counters
    this.requests.set(minuteKey, minuteCount + 1);
    this.hourlyRequests.set(hourKey, hourCount + 1);

    // Check for abuse patterns
    if (minuteCount + 1 >= config.rateLimit.maxRequestsPerMinute * 0.8) {
      console.warn(`User ${userId} approaching rate limit`);
    }

    return { allowed: true };
  }

  /**
   * Block user temporarily
   */
  blockUser(userId, duration = 300000) { // 5 minutes default
    this.blockedUsers.add(userId);
    setTimeout(() => {
      this.blockedUsers.delete(userId);
    }, duration);
  }

  /**
   * Clean old entries to prevent memory leaks
   */
  cleanOldEntries(now) {
    const oneHourAgo = now - 3600000;
    const oneMinuteAgo = now - 60000;

    // Clean minute entries
    for (const [key] of this.requests) {
      const timestamp = parseInt(key.split('_')[1]) * 60000;
      if (timestamp < oneMinuteAgo) {
        this.requests.delete(key);
      }
    }

    // Clean hour entries
    for (const [key] of this.hourlyRequests) {
      const timestamp = parseInt(key.split('_')[1]) * 3600000;
      if (timestamp < oneHourAgo) {
        this.hourlyRequests.delete(key);
      }
    }
  }

  /**
   * Get current usage stats
   */
  getUsageStats(userId = 'anonymous') {
    const now = Date.now();
    const minuteKey = `${userId}_${Math.floor(now / 60000)}`;
    const hourKey = `${userId}_${Math.floor(now / 3600000)}`;

    return {
      minuteUsage: this.requests.get(minuteKey) || 0,
      hourUsage: this.hourlyRequests.get(hourKey) || 0,
      minuteLimit: config.rateLimit.maxRequestsPerMinute,
      hourLimit: config.rateLimit.maxRequestsPerHour,
      isBlocked: this.blockedUsers.has(userId)
    };
  }
}

/**
 * Content filter for responses
 */
export class ContentFilter {
  static filterResponse(response) {
    if (!response || typeof response !== 'string') return '';

    // Remove any potential harmful content from AI responses
    return response
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  static isResponseSafe(response) {
    if (!response) return false;

    // Check for inappropriate content patterns
    const inappropriatePatterns = [
      /\b(hack|crack|exploit|vulnerability)\b/gi,
      /<script/gi,
      /javascript:/gi
    ];

    return !inappropriatePatterns.some(pattern => pattern.test(response));
  }
}

/**
 * Session management
 */
export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  createSession(userId = 'anonymous') {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const now = Date.now();
    if (now - session.lastActivity > this.sessionTimeout) {
      this.sessions.delete(sessionId);
      return false;
    }

    session.lastActivity = now;
    return true;
  }

  updateSessionActivity(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      session.messageCount++;
    }
  }

  generateSessionId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  cleanExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity > this.sessionTimeout) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Create singleton instances
export const inputValidator = new InputValidator();
export const rateLimiter = new RateLimiter();
export const contentFilter = new ContentFilter();
export const sessionManager = new SessionManager();

// Clean up expired sessions periodically
setInterval(() => {
  sessionManager.cleanExpiredSessions();
}, 5 * 60 * 1000); // Every 5 minutes
