import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeContent,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeSearchQuery,
} from '../sanitize';

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('escapes ampersand', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#x27;s');
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('preserves normal text', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('sanitizeContent', () => {
  it('removes javascript: URLs', () => {
    expect(sanitizeContent('javascript:alert(1)')).not.toContain('javascript:');
  });

  it('removes data: URLs', () => {
    expect(sanitizeContent('data:text/html,<script>alert(1)</script>')).not.toContain('data:');
  });

  it('removes event handlers', () => {
    expect(sanitizeContent('<img onerror="alert(1)">')).not.toContain('onerror=');
    expect(sanitizeContent('<body onload="alert(1)">')).not.toContain('onload=');
  });

  it('handles null and undefined', () => {
    expect(sanitizeContent(null)).toBe('');
    expect(sanitizeContent(undefined)).toBe('');
  });

  it('preserves legitimate content', () => {
    expect(sanitizeContent('Hello, this is a normal message!')).toBe(
      'Hello, this is a normal message!'
    );
  });
});

describe('sanitizeUrl', () => {
  it('allows http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('allows https URLs', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('allows mailto URLs', () => {
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
  });

  it('allows relative URLs', () => {
    expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page');
  });

  it('rejects javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('rejects data: URLs', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
  });

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeUrl('//evil.com/path')).toBe('');
  });

  it('handles null and undefined', () => {
    expect(sanitizeUrl(null)).toBe('');
    expect(sanitizeUrl(undefined)).toBe('');
  });
});

describe('sanitizeFilename', () => {
  it('removes path separators', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
    expect(sanitizeFilename('path/to/file.txt')).toBe('pathtofile.txt');
    expect(sanitizeFilename('path\\to\\file.txt')).toBe('pathtofile.txt');
  });

  it('removes null bytes', () => {
    expect(sanitizeFilename('file\0name.txt')).toBe('filename.txt');
  });

  it('preserves normal filenames', () => {
    expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
    expect(sanitizeFilename('my-file_v2.txt')).toBe('my-file_v2.txt');
  });
});

describe('sanitizeSearchQuery', () => {
  it('escapes regex special characters', () => {
    expect(sanitizeSearchQuery('test.*pattern')).toBe('test\\.\\*pattern');
    expect(sanitizeSearchQuery('foo+bar')).toBe('foo\\+bar');
    expect(sanitizeSearchQuery('price: $100')).toBe('price: \\$100');
  });

  it('preserves normal search terms', () => {
    expect(sanitizeSearchQuery('john doe')).toBe('john doe');
    expect(sanitizeSearchQuery('patient name')).toBe('patient name');
  });
});
