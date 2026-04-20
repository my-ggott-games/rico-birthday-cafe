import React, { Suspense, lazy } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

const NotFound = lazy(() => import("../../pages/NotFound"));

export const AdminOnlyRoute: React.FC = () => {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  if (!hasHydrated) {
    return null;
  }

  if (!isAdmin) {
    return (
      <Suspense fallback={null}>
        <NotFound />
      </Suspense>
    );
  }

  return <Outlet />;
};
