// Jest setup file
import 'jest-environment-node'

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = ':memory:'

// Global test timeout
jest.setTimeout(30000)

// Mock console.error to suppress expected error logs during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})