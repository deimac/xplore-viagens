import React from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function AdminRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const [, navigate] = useLocation();
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate("/admin/login");
    }
  }, [isLoading, user, navigate]);

  if (isLoading) return null;
  if (!user) return null;

  return <Component />;
}
