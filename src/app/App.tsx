import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AppLayout } from '../components/layout/AppLayout'
import { routes } from './routes'

export function App() {
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
