import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GRID_COMPAT_PATH = path.join(__dirname, 'src/components/GridCompat.jsx')

function legacyGridCompat() {
  return {
    name: 'legacy-grid-compat',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('node_modules')) return null
      if (!id.endsWith('.jsx') && !id.endsWith('.js')) return null
      if (!/\bGrid\b/.test(code)) return null

      const importRe = /import\s*\{([\s\S]*?)\}\s*from\s*['"]@mui\/material['"]/
      const match = code.match(importRe)
      if (!match) return null

      const parts = match[1].split(',').map((s) => s.trim())
      const hasGrid = parts.some((s) => s.replace(/\s+as\s+.+$/, '').trim() === 'Grid')
      if (!hasGrid) return null

      const rest = parts.filter((s) => s.replace(/\s+as\s+.+$/, '').trim() !== 'Grid')
      const rel = path.relative(path.dirname(id), GRID_COMPAT_PATH).replace(/\\/g, '/')
      const importPath = rel.startsWith('.') ? rel : `./${rel}`

      const gridImport = `import Grid from '${importPath}';`
      const muiImport = rest.length
        ? `import { ${rest.join(', ')} } from '@mui/material';`
        : ''

      return code.replace(match[0], [gridImport, muiImport].filter(Boolean).join('\n'))
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), legacyGridCompat()],
  base: './',
})
