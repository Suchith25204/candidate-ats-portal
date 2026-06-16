import { Navigate, Outlet } from 'react-router-dom';
import { useStytchUser } from '@stytch/react';

export default function ProtectedRoute() {
  const { user, isInitialized } = useStytchUser();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium text-sm">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate replace to="/" />;
  }

  return <Outlet />;
}
