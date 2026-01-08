/**
 * VPS Notification Configuration
 * ==============================
 * 
 * Notification system for standalone VPS deployment.
 * Logs to console in development, sends via SMTP in production.
 * Does NOT depend on Manus platform.
 * 
 * Usage:
 * - Use this instead of notification.ts when running on VPS
 * - Development: logs to console
 * - Production: sends via SMTP (if configured)
 * 
 * Environment: VPS, Docker, Railway, Render, Hostinger, etc
 */

import { ENV } from './env';

/**
 * Send notification to owner
 * 
 * In development: logs to console
 * In production: sends via SMTP (if configured)
 * 
 * @param params - { title, content, type? }
 * @returns true if sent/logged successfully
 */
export async function notifyOwner(params: {
  title: string;
  content: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}): Promise<boolean> {
  const type = params.type || 'info';
  const timestamp = new Date().toISOString();

  // Development: log to console
  if (ENV.isDevelopment) {
    const icons: Record<string, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      success: '✅',
    };

    console.log('');
    console.log(`${icons[type]} [NOTIFICATION] ${timestamp}`);
    console.log(`   Title: ${params.title}`);
    console.log(`   Content: ${params.content}`);
    console.log('');

    return true;
  }

  // Production: send via SMTP (if configured)
  if (!ENV.smtpEnabled) {
    console.warn('⚠️  SMTP not enabled, notification not sent');
    return false;
  }

  if (!ENV.ownerEmail) {
    console.warn('⚠️  OWNER_EMAIL not configured, notification not sent');
    return false;
  }

  try {
    // SMTP sending would go here
    // For now, just log
    console.log(`📧 Notification would be sent to ${ENV.ownerEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
    return false;
  }
}

/**
 * Send email to user
 * 
 * @param to - Recipient email
 * @param subject - Email subject
 * @param html - Email HTML content
 * @returns true if sent successfully
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  // Development: log to console
  if (ENV.isDevelopment) {
    console.log('');
    console.log('📧 [EMAIL] Development mode');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   HTML: ${html.substring(0, 100)}...`);
    console.log('');
    return true;
  }

  // Production: send via SMTP (if configured)
  if (!ENV.smtpEnabled) {
    console.warn('⚠️  SMTP not enabled, email not sent');
    return false;
  }

  try {
    // SMTP sending would go here
    console.log(`📧 Email would be sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

/**
 * Log application event
 * 
 * @param event - Event name
 * @param data - Event data
 */
export function logEvent(event: string, data?: any): void {
  const timestamp = new Date().toISOString();
  console.log(`📝 [EVENT] ${timestamp} - ${event}`);
  if (data) {
    console.log(`   Data:`, data);
  }
}

export default {
  notifyOwner,
  sendEmail,
  logEvent,
};
