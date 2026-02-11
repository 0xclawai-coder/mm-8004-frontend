import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChainFilter } from '../ChainFilter'

describe('ChainFilter', () => {
  it('renders all chain options', () => {
    render(<ChainFilter selected={undefined} onSelect={() => {}} />)
    expect(screen.getByText('All Chains')).toBeInTheDocument()
    expect(screen.getByText('Monad')).toBeInTheDocument()
    expect(screen.getByText('Testnet')).toBeInTheDocument()
  })

  it('renders the correct number of buttons', () => {
    render(<ChainFilter selected={undefined} onSelect={() => {}} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3) // All Chains, Monad, Testnet
  })

  it('highlights "All Chains" when selected is undefined', () => {
    render(<ChainFilter selected={undefined} onSelect={() => {}} />)
    const allButton = screen.getByText('All Chains')
    expect(allButton.className).toContain('bg-primary')
  })

  it('highlights Monad (143) when selected', () => {
    render(<ChainFilter selected={143} onSelect={() => {}} />)
    const monadButton = screen.getByText('Monad')
    expect(monadButton.closest('button')!.className).toContain('bg-primary')
  })

  it('highlights Testnet (10143) when selected', () => {
    render(<ChainFilter selected={10143} onSelect={() => {}} />)
    const testnetButton = screen.getByText('Testnet')
    expect(testnetButton.closest('button')!.className).toContain('bg-primary')
  })

  it('calls onSelect with 143 when Monad is clicked', () => {
    const handleSelect = vi.fn()
    render(<ChainFilter selected={undefined} onSelect={handleSelect} />)
    fireEvent.click(screen.getByText('Monad'))
    expect(handleSelect).toHaveBeenCalledWith(143)
  })

  it('calls onSelect with 10143 when Testnet is clicked', () => {
    const handleSelect = vi.fn()
    render(<ChainFilter selected={undefined} onSelect={handleSelect} />)
    fireEvent.click(screen.getByText('Testnet'))
    expect(handleSelect).toHaveBeenCalledWith(10143)
  })

  it('calls onSelect with undefined when "All Chains" is clicked', () => {
    const handleSelect = vi.fn()
    render(<ChainFilter selected={143} onSelect={handleSelect} />)
    fireEvent.click(screen.getByText('All Chains'))
    expect(handleSelect).toHaveBeenCalledWith(undefined)
  })

  it('displays chain ID numbers in parentheses for Monad and Testnet', () => {
    render(<ChainFilter selected={undefined} onSelect={() => {}} />)
    expect(screen.getByText('(143)')).toBeInTheDocument()
    expect(screen.getByText('(10143)')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ChainFilter selected={undefined} onSelect={() => {}} className="test-class" />
    )
    expect(container.firstChild).toHaveClass('test-class')
  })
})
