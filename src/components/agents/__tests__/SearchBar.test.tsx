import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SearchBar } from '../SearchBar'

describe('SearchBar', () => {
  it('renders an input element', () => {
    render(<SearchBar value="" onChange={() => {}} />)
    const input = screen.getByPlaceholderText('Search agents...')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
  })

  it('displays the provided value', () => {
    render(<SearchBar value="test query" onChange={() => {}} />)
    const input = screen.getByPlaceholderText('Search agents...')
    expect(input).toHaveValue('test query')
  })

  it('updates the internal input value when typing', () => {
    render(<SearchBar value="" onChange={() => {}} />)
    const input = screen.getByPlaceholderText('Search agents...')
    fireEvent.change(input, { target: { value: 'defi agent' } })
    expect(input).toHaveValue('defi agent')
  })

  it('calls onChange after debounce delay', async () => {
    vi.useFakeTimers()
    const handleChange = vi.fn()
    render(<SearchBar value="" onChange={handleChange} />)

    const input = screen.getByPlaceholderText('Search agents...')
    fireEvent.change(input, { target: { value: 'hello' } })

    // onChange should NOT have been called immediately
    expect(handleChange).not.toHaveBeenCalled()

    // Advance time past the 300ms debounce
    act(() => {
      vi.advanceTimersByTime(350)
    })

    expect(handleChange).toHaveBeenCalledWith('hello')
    vi.useRealTimers()
  })

  it('does not call onChange if the typed value matches the external value', async () => {
    vi.useFakeTimers()
    const handleChange = vi.fn()
    render(<SearchBar value="same" onChange={handleChange} />)

    const input = screen.getByPlaceholderText('Search agents...')
    // Type the same value that was already passed
    fireEvent.change(input, { target: { value: 'same' } })

    act(() => {
      vi.advanceTimersByTime(350)
    })

    // onChange should not fire because internalValue === value
    expect(handleChange).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('applies custom className', () => {
    const { container } = render(
      <SearchBar value="" onChange={() => {}} className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('debounces rapid typing — only fires once', async () => {
    vi.useFakeTimers()
    const handleChange = vi.fn()
    render(<SearchBar value="" onChange={handleChange} />)

    const input = screen.getByPlaceholderText('Search agents...')

    // Simulate rapid typing
    fireEvent.change(input, { target: { value: 'a' } })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    fireEvent.change(input, { target: { value: 'ab' } })
    act(() => {
      vi.advanceTimersByTime(100)
    })
    fireEvent.change(input, { target: { value: 'abc' } })

    // Not yet fired
    expect(handleChange).not.toHaveBeenCalled()

    // Wait for full debounce after last keystroke
    act(() => {
      vi.advanceTimersByTime(350)
    })

    // Should only fire once with the final value
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange).toHaveBeenCalledWith('abc')
    vi.useRealTimers()
  })
})
