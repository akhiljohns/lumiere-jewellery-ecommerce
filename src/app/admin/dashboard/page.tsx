import { DashboardClient } from "@/features/dashboard/components/dashboard-client";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of your jewellery store
        </p>
      </div>

      <DashboardClient />
    </div>
  );
}
