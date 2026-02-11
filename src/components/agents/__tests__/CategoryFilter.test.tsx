import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryFilter } from '../CategoryFilter'

const ALL_CATEGORIES = ['All', 'Legal', 'Design', 'Trading', 'DeFi', 'Arbitrage', 'Other']

describe('CategoryFilter', () => {
  it('renders all category chips', () => {
    render(<CategoryFilter selected="" onSelect={() => {}} />)
    for (const category of ALL_CATEGORIES) {
      expect(screen.getByText(category)).toBeInTheDocument()
    }
  })

  it('renders the correct number of buttons', () => {
    render(<CategoryFilter selected="" onSelect={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(ALL_CATEGORIES.length)
  })

  it('highlights "All" when selected is empty string', () => {
    render(<CategoryFilter selected="" onSelect={() => {}} />)
    const allButton = screen.getByText('All')
    // The "All" button should use the "default" variant (non-outline)
    expect(allButton).not.toHaveAttribute('data-variant', 'outline')
  })

  it('highlights the selected category', () => {
    render(<CategoryFilter selected="DeFi" onSelect={() => {}} />)
    const defiButton = screen.getByText('DeFi')
    // DeFi is selected, so its classes should contain the active style
    expect(defiButton.className).toContain('bg-primary')
  })

  it('calls onSelect with category name when a chip is clicked', () => {
    const handleSelect = vi.fn()
    render(<CategoryFilter selected="" onSelect={handleSelect} />)
    fireEvent.click(screen.getByText('Trading'))
    expect(handleSelect).toHaveBeenCalledWith('Trading')
  })

  it('calls onSelect with empty string when "All" is clicked', () => {
    const handleSelect = vi.fn()
    render(<CategoryFilter selected="DeFi" onSelect={handleSelect} />)
    fireEvent.click(screen.getByText('All'))
    expect(handleSelect).toHaveBeenCalledWith('')
  })

  it('applies custom className', () => {
    const { container } = render(
      <CategoryFilter selected="" onSelect={() => {}} className="my-custom-class" />
    )
    expect(container.firstChild).toHaveClass('my-custom-class')
  })

  it('only one category should show the active style at a time', () => {
    render(<CategoryFilter selected="Legal" onSelect={() => {}} />)
    const legalButton = screen.getByText('Legal')
    const tradingButton = screen.getByText('Trading')

    // Legal should be active
    expect(legalButton.className).toContain('bg-primary')
    // Trading should not be active (should have transparent style)
    expect(tradingButton.className).toContain('bg-transparent')
  })
})
