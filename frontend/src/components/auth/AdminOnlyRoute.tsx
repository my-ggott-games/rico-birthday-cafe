import React, { Suspense, lazy } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

const NotFound = lazy(() => import("../../pages/NotFound"));

export const AdminOnlyRoute: React.FC = () => {
  const isAdmin = useAuthStore((state) => state.isAdmin);

  if (!isAdmin) {
    return (
      <Suspense fallback={null}>
        <NotFound />
      </Suspense>
    );
  }

  return <Outlet />;
};
