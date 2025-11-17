import { render, type RenderOptions } from '@testing-library/react'
import { type ReactElement } from 'react'

/**
 * Custom render function that wraps components with common providers
 * Extend this as needed when you add providers like ThemeProvider, WalletProvider, etc.
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Override the default render with our custom one
export { customRender as render }
