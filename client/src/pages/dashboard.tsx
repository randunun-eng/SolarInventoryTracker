import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/stats-card";
import { BarChart } from "@/components/dashboard/bar-chart";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, Cpu, AlertTriangle, Wrench, DollarSign, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { getStatusColor, formatDateTime } from "@/lib/utils";

export default function Dashboard() {
  // Fetch components count
  const { data: components, isLoading: isLoadingComponents } = useQuery({
    queryKey: ["/api/components"],
  });

  // Fetch low stock components
  const { data: lowStockComponents, isLoading: isLoadingLowStock } = useQuery({
    queryKey: ["/api/components/low-stock"],
  });

  // Fetch active repairs
  const { data: activeRepairs, isLoading: isLoadingActiveRepairs } = useQuery({
    queryKey: ["/api/repairs/active"],
  });

  // Fetch recent repairs
  const { data: recentRepairs, isLoading: isLoadingRecentRepairs } = useQuery({
    queryKey: ["/api/repairs/recent"],
  });

  // Fetch most used components
  const { data: mostUsedComponents, isLoading: isLoadingMostUsed } = useQuery({
    queryKey: ["/api/dashboard/used-components"],
  });

  // Fetch common fault types
  const { data: commonFaultTypes, isLoading: isLoadingFaultTypes } = useQuery({
    queryKey: ["/api/dashboard/fault-types"],
  });

  // Calculate monthly revenue (example calculation)
  const calculateMonthlyRevenue = () => {
    if (!recentRepairs) return 0;
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyRepairs = recentRepairs.filter(repair => 
      new Date(repair.receivedDate) >= monthStart
    );
    
    return monthlyRepairs.reduce((sum, repair) => sum + (repair.totalCost || 0), 0);
  };

  const isLoading = isLoadingComponents || isLoadingLowStock || isLoadingActiveRepairs;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500">Overview of your inventory and repair operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Components Card */}
        <StatsCard
          title="Total Components"
          value={isLoadingComponents ? "Loading..." : components?.length || 0}
          icon={Cpu}
          iconBgColor="bg-primary-100"
          iconColor="text-primary-600"
          change={{
            value: 12,
            label: "from last month",
            type: "increase"
          }}
        />

        {/* Low Stock Card */}
        <StatsCard
          title="Low Stock Items"
          value={isLoadingLowStock ? "Loading..." : lowStockComponents?.length || 0}
          icon={AlertTriangle}
          iconBgColor="bg-orange-100"
          iconColor="text-orange-500"
          change={{
            value: 5,
            label: "from last week",
            type: "increase"
          }}
        />

        {/* Active Repairs Card */}
        <StatsCard
          title="Active Repairs"
          value={isLoadingActiveRepairs ? "Loading..." : activeRepairs?.length || 0}
          icon={Wrench}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
          change={{
            value: 18,
            label: "from last month",
            type: "increase"
          }}
        />

        {/* Revenue Card */}
        <StatsCard
          title="Monthly Revenue"
          value={`$${calculateMonthlyRevenue().toLocaleString()}`}
          icon={DollarSign}
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
          change={{
            value: 8,
            label: "from last month",
            type: "increase"
          }}
        />
      </div>

      {/* Recent Activity and Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Low Stock Components */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>Low Stock Components</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLowStock ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : lowStockComponents && lowStockComponents.length > 0 ? (
              <ul className="divide-y divide-slate-200">
                {lowStockComponents.slice(0, 5).map((item) => (
                  <li key={item.id} className="py-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.partNumber}</p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          item.currentStock <= 0 ? "bg-red-100 text-red-800" : "bg-orange-100 text-orange-800"
                        }`}>
                          {item.currentStock} left
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center py-6 text-slate-500">No low stock items found</p>
            )}
            <div className="mt-4">
              <Link href="/stockalerts">
                <Button variant="link" className="p-0 h-auto">
                  <span className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
                    View all low stock
                    <ArrowRight className="ml-1 text-xs" size={14} />
                  </span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Repairs */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Recent Repairs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRecentRepairs ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentRepairs && recentRepairs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Inverter</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {recentRepairs.map((repair) => {
                      const { bg, text } = getStatusColor(repair.status);
                      return (
                        <tr key={repair.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-800">Client #{repair.clientId}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-slate-600">Inverter #{repair.inverterId}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
                              {repair.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                            {formatDateTime(repair.receivedDate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <Link href={`/repairs/${repair.id}`}>
                              <a className="text-primary-600 hover:text-primary-900">View</a>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-6 text-slate-500">No recent repairs found</p>
            )}
            <div className="mt-4">
              <Link href="/repairs">
                <Button variant="link" className="p-0 h-auto">
                  <span className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
                    View all repairs
                    <ArrowRight className="ml-1 text-xs" size={14} />
                  </span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory and Repair Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Components */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Most Used Components</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMostUsed ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : mostUsedComponents && mostUsedComponents.length > 0 ? (
              <div className="space-y-4">
                {mostUsedComponents.map((component, index) => (
                  <ProgressBar
                    key={index}
                    label={component.componentName}
                    value={`${component.totalUsed} used`}
                    percentage={(component.totalUsed / Math.max(...mostUsedComponents.map(c => c.totalUsed))) * 100}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-slate-500">No component usage data available</p>
            )}
          </CardContent>
        </Card>

        {/* Repair Types */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Common Repair Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingFaultTypes ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : commonFaultTypes && commonFaultTypes.length > 0 ? (
              <div className="space-y-4">
                {commonFaultTypes.map((faultType, index) => (
                  <ProgressBar
                    key={index}
                    label={faultType.faultTypeName}
                    value={`${faultType.percentage}%`}
                    percentage={faultType.percentage}
                    color="bg-orange-500"
                  />
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-slate-500">No fault type data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
