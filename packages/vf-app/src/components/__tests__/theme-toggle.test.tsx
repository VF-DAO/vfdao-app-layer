import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeToggle } from '@/components/theme-toggle'

describe('ThemeToggle', () => {
  it('renders theme toggle button', () => {
    render(<ThemeToggle />)
    
    // Check if the theme toggle button is in the document
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('has accessible name', () => {
    render(<ThemeToggle />)
    
    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
  })
})
