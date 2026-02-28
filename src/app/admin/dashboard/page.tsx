import {
  Package,
  Users,
  IndianRupee,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDashboardStats } from "@/features/dashboard/services/stats-service";
import { getProducts } from "@/features/products/services/product-service";
import { getUsers } from "@/features/users/services/user-service";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, productsResult, usersResult] = await Promise.all([
    getDashboardStats(),
    getProducts({ page: 1, limit: 5, sort: "created_at", order: "desc" }),
    getUsers({ page: 1, limit: 5, sort: "created_at", order: "desc" }),
  ]);

  const recentProducts = productsResult.data;
  const recentUsers = usersResult.data;

  const statCards = [
    {
      title: "Total Products",
      value: stats.products.total,
      icon: Package,
      description: `${stats.products.active} active, ${stats.products.inactive} inactive`,
    },
    {
      title: "Total Users",
      value: stats.users.total,
      icon: Users,
      description: `${stats.users.admins} admins, ${stats.users.customers} customers`,
    },
    {
      title: "Inventory Value",
      value: formatCurrency(stats.products.inventory_value),
      icon: IndianRupee,
      description: "Total stock value",
    },
    {
      title: "Out of Stock",
      value: stats.products.out_of_stock,
      icon: AlertTriangle,
      description:
        stats.products.out_of_stock > 0 ? "Needs attention" : "All stocked",
    },
    {
      title: "Total Orders",
      value: stats.orders.total,
      icon: ShoppingCart,
      description: `${stats.orders.pending} pending, ${stats.orders.processing} processing`,
    },
    {
      title: "Revenue",
      value: formatCurrency(stats.orders.revenue),
      icon: TrendingUp,
      description: `${stats.orders.delivered} delivered`,
    },
  ];

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

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Products */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Products</CardTitle>
            <CardDescription>
              Last {recentProducts.length} products added
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No products yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="max-w-[140px] truncate font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <Badge
                          variant={product.is_active ? "default" : "secondary"}
                        >
                          {product.is_active ? "Active" : "Draft"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>
              Last {recentUsers.length} users registered
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No users yet
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="max-w-[160px] truncate">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        {user.full_name || (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
