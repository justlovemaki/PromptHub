const fs = require('fs')
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    // Load tags files as environment variables
    PROMPT_TAGS_CN: (() => {
      try {
        return fs.readFileSync(path.join(__dirname, 'src/tags/tags-cn.json'), 'utf8')
      } catch (error) {
        console.warn('Failed to load tags-cn.json:', error.message)
        return '{}'
      }
    })(),
    PROMPT_TAGS_EN: (() => {
      try {
        return fs.readFileSync(path.join(__dirname, 'src/tags/tags-en.json'), 'utf8')
      } catch (error) {
        console.warn('Failed to load tags-en.json:', error.message)
        return '{}'
      }
    })(),
    PROMPT_TAGS_JA: (() => {
      try {
        return fs.readFileSync(path.join(__dirname, 'src/tags/tags-ja.json'), 'utf8')
      } catch (error) {
        console.warn('Failed to load tags-ja.json:', error.message)
        return '{}'
      }
    })()
  }
}

module.exports = nextConfig