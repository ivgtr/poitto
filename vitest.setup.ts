import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'

// @ts-expect-error - React 19 specific
global.IS_REACT_ACT_ENVIRONMENT = true

let consoleErrorMock: ReturnType<typeof vi.spyOn> | null = null

beforeEach(() => {
  consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  consoleErrorMock?.mockRestore()
  consoleErrorMock = null
})
