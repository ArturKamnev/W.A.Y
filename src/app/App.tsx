import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { usePreferencesStore } from '../store/useStores'
import { routes } from './routes'

export function App() {
  const theme = usePreferencesStore((state) => state.theme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  return (
    <BrowserRouter>
      <AnimatePresence mode="wait">
        <Routes>
          <Route element={<AppLayout />}>
            {routes
              .filter((route) => route.path !== '*')
              .map((route) => (
                <Route key={route.path} path={route.path} element={route.element} />
              ))}
          </Route>
          {routes
            .filter((route) => route.path === '*')
            .map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
        </Routes>
      </AnimatePresence>
    </BrowserRouter>
  )
}
