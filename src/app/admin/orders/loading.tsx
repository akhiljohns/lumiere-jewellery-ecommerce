import { TableSkeleton } from "@/components/page-loader";

export default function OrdersLoading() {
  return <TableSkeleton rows={10} />;
}
