// src/router/Guards.jsx
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext' // ajusta la ruta a tu contexto

// Solo deja pasar si HAY sesión activa (ej: /home, /tienda)
export function PrivateRoute() {
  const { user } = useAuth()
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

// Solo deja pasar si NO HAY sesión (ej: /login, /registro)
export function PublicRoute() {
  const { user } = useAuth()
  return !user ? <Outlet /> : <Navigate to="/home" replace />
}