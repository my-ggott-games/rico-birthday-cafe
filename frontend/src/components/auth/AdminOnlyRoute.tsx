import React from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import NotFound from "../../pages/NotFound";

export const AdminOnlyRoute: React.FC = () => {
  const isAdmin = useAuthStore((state) => state.isAdmin);

  if (!isAdmin) {
    return <NotFound />;
  }

  return <Outlet />;
};
