/**
 * Utility function for merging CSS classes.
 * Simplified version that concatenates classes and filters falsy values.
 *
 * @example
 * cn('px-4 py-2', condition && 'bg-blue-600', className)
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
