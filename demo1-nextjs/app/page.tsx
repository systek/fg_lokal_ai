import App from '@/client/App'

// The whole UI is one client component that talks to the API routes under app/api,
// just like the separate Vite frontend in demo1 does.
export default function Page() {
  return <App />
}
