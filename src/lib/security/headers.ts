/**
 * Security Headers Configuration
 * Provides security headers for HTTP responses
 */

export class SecurityHeaders {
  static getHeaders(): Record<string, string> {
    return {
      'X-DNS-Prefetch-Control': 'on',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    };
  }

  static getContentSecurityPolicy(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.groq.com https://api-inference.huggingface.co",
      "frame-ancestors 'none'",
    ].join('; ');
  }
}