import React, { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { ToastProvider } from '../components/ui/Toast';

/**
 * All the providers that wrap the application
 */
function AllProviders({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

/**
 * Custom render function that wraps components with all necessary providers
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render with custom render
export { customRender as render };

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  plan: 'basic' as const,
  role: 'doctor' as const,
  subscription_status: 'active' as const,
  is_verified: true,
  is_beta_tester: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

/**
 * Mock Pro user data for testing
 */
export const mockProUser = {
  ...mockUser,
  plan: 'pro' as const,
};

/**
 * Mock patient data for testing
 */
export const mockPatient = {
  id: 'patient-123',
  patient_id: 'PAT-001',
  name: 'John Doe',
  phone: '+1234567890',
  email: 'john@example.com',
  location: 'New York',
  is_favorite: false,
  year_of_birth: 1990,
  gender: 'male' as const,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

/**
 * Mock paginated response for testing
 */
export function mockPaginatedResponse<T>(items: T[], total?: number) {
  return {
    items,
    total: total ?? items.length,
    page: 1,
    page_size: 20,
    total_pages: Math.ceil((total ?? items.length) / 20),
  };
}

/**
 * Wait for async operations to complete
 */
export async function waitForAsync() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}
