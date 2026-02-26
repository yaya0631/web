import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isGithubPages = process.env.GITHUB_PAGES === '1'
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'web'

export default defineConfig({
  base: isGithubPages ? `/${repoName}/` : '/',
  envPrefix: ['VITE_', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  plugins: [react()],
})
