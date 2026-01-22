import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children, session }) {
  const location = useLocation()

  // undefined means we are still checking (though App.jsx handles this now)
  if (session === undefined) return null;

  if (!session) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }}
        replace 
      />
    )
  }

  // Check if email is verified
  if (!session.user.email_confirmed_at) {
    return (
      <Navigate 
        to="/verify-email" 
        state={{ from: location.pathname }}
        replace 
      />
    )
  }

  return children
}
