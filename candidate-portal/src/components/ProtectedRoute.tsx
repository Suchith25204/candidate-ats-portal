import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const isRecruiter = !!localStorage.getItem('recruiterEmail');
  const isCandidate = !!localStorage.getItem('candidateEmail');

  if (!isRecruiter && !isCandidate) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
