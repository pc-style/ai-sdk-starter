import { EmailMessage } from './types';

export type InboxCategory = 'important' | 'newsletters' | 'social' | 'promotions' | 'other';

export class InboxCategorizer {
  /**
   * Categorize email based on heuristics
   * Can be enhanced with AI categorization for better accuracy
   */
  static categorize(email: EmailMessage): InboxCategory {
    const subject = email.subject.toLowerCase();
    const from = email.from.email.toLowerCase();
    const snippet = email.snippet.toLowerCase();

    // Newsletter patterns
    const newsletterPatterns = [
      'unsubscribe',
      'newsletter',
      'weekly digest',
      'daily digest',
      'mailing list',
      'view in browser',
    ];

    if (newsletterPatterns.some((pattern) => snippet.includes(pattern) || subject.includes(pattern))) {
      return 'newsletters';
    }

    // Social patterns
    const socialDomains = [
      'facebook.com',
      'twitter.com',
      'linkedin.com',
      'instagram.com',
      'pinterest.com',
      'reddit.com',
    ];

    if (socialDomains.some((domain) => from.includes(domain))) {
      return 'social';
    }

    // Promotion patterns
    const promotionWords = [
      'sale',
      'discount',
      'offer',
      'deal',
      'coupon',
      'promo',
      '% off',
      'limited time',
      'free shipping',
    ];

    if (promotionWords.some((word) => subject.includes(word) || snippet.includes(word))) {
      return 'promotions';
    }

    // Important patterns
    const importantWords = [
      'urgent',
      'important',
      'action required',
      'deadline',
      'asap',
      'critical',
      'alert',
      'verify',
      'confirm',
    ];

    if (
      email.isStarred ||
      importantWords.some((word) => subject.includes(word) || snippet.includes(word))
    ) {
      return 'important';
    }

    return 'other';
  }

  static categorizeMultiple(emails: EmailMessage[]): Record<InboxCategory, EmailMessage[]> {
    return emails.reduce(
      (acc, email) => {
        const category = this.categorize(email);
        acc[category].push(email);
        return acc;
      },
      {
        important: [],
        newsletters: [],
        social: [],
        promotions: [],
        other: [],
      } as Record<InboxCategory, EmailMessage[]>
    );
  }
}
