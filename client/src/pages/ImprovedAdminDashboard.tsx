import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Users, Store, Package, ShoppingCart, DollarSign, TrendingUp, AlertTriangle, 
  Eye, Edit, Trash2, Plus, Download, Upload, Search, Filter, MoreHorizontal,
  CheckCircle, XCircle, Clock, Ban, Settings, Bell, Shield, CreditCard,
  BarChart3, FileText, MessageSquare, Tag, Image, Globe, Zap, UserCheck,
  LogOut, RefreshCw, Calendar, Mail, Phone, MapPin, Truck, Star, Activity,
  PieChart, LineChart, Target, Award, Briefcase, Building, Home
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ImprovedAdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("adminUser");
    if (stored && stored !== "undefined" && stored !== "null") {
      try {
        const adminData = JSON.parse(stored);
        setAdminUser(adminData);
      } catch (error) {
        console.error('Error parsing admin user data:', error);
        localStorage.removeItem("adminUser");
        setLocation("/admin/login");
      }
    } else {
      setLocation("/admin/login");
    }
  }, [setLocation]);

  // Data fetching queries
  const { data: dashboardStats = {} } = useQuery({
    queryKey: ["/api/admin/dashboard/stats"],
    enabled: !!adminUser,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: !!adminUser,
  }) as { data: any[] };

  const { data: allStores = [] } = useQuery({
    queryKey: ["/api/admin/stores"],
    enabled: !!adminUser,
  }) as { data: any[] };

  const { data: allProducts = [] } = useQuery({
    queryKey: ["/api/admin/products"],
    enabled: !!adminUser,
  }) as { data: any[] };

  const { data: allOrders = [] } = useQuery({
    queryKey: ["/api/admin/orders"],
    enabled: !!adminUser,
  }) as { data: any[] };

  const { data: pendingUsers = [] } = useQuery({
    queryKey: ["/api/admin/users/pending"],
    enabled: !!adminUser,
  }) as { data: any[] };

  const { data: coupons = [] } = useQuery({
    queryKey: ["/api/admin/coupons"],
    enabled: !!adminUser,
  }) as { data: any[] };

  const { data: deliveryZones = [] } = useQuery({
    queryKey: ["/api/delivery-zones"],
    enabled: !!adminUser,
  }) as { data: any[] };

  // Mutations
  const approveUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest(`/api/admin/users/${userId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: adminUser.id }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/pending"] });
      toast({ title: "Success", description: "User approved successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to approve user",
        variant: "destructive"
      });
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: number; reason: string }) => {
      const response = await apiRequest(`/api/admin/users/${userId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: adminUser.id, reason }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users/pending"] });
      toast({ title: "Success", description: "User rejected successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to reject user",
        variant: "destructive"
      });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest(`/api/admin/users/${userId}/ban`, {
        method: "PUT",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User banned successfully" });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest(`/api/admin/users/${userId}/unban`, {
        method: "PUT",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Success", description: "User unbanned successfully" });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    setLocation("/admin/login");
  };

  // Calculate stats
  const totalUsers = Array.isArray(allUsers) ? allUsers.length : 0;
  const totalStores = Array.isArray(allStores) ? allStores.length : 0;
  const totalProducts = Array.isArray(allProducts) ? allProducts.length : 0;
  const totalOrders = Array.isArray(allOrders) ? allOrders.length : 0;
  const pendingApprovals = Array.isArray(pendingUsers) ? pendingUsers.length : 0;
  const activeUsers = Array.isArray(allUsers) ? allUsers.filter((user: any) => user.status === 'active').length : 0;
  const totalRevenue = Array.isArray(allOrders) ? allOrders.reduce((sum: number, order: any) => sum + (order.total || 0), 0) : 0;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Status badge components
  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      banned: "bg-red-100 text-red-800",
      rejected: "bg-gray-100 text-gray-800",
    };
    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "users", label: "Users", icon: Users },
    { id: "stores", label: "Stores", icon: Store },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "pending", label: "Pending Approvals", icon: Clock },
    { id: "coupons", label: "Coupons", icon: Tag },
    { id: "delivery", label: "Delivery Zones", icon: Truck },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (!adminUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className="bg-white shadow-lg border-r border-gray-200 flex flex-col"
      >
        {/* Logo and Admin Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            {!sidebarCollapsed && (
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">Siraha Bazaar</p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {adminUser.fullName?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{adminUser.fullName}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
                {item.id === "pending" && pendingApprovals > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white">
                    {pendingApprovals}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full justify-start"
          >
            <Filter className="h-4 w-4" />
            {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {activeTab.replace("-", " ")}
              </h2>
              <p className="text-sm text-gray-500">
                Manage your platform efficiently
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
                            <p className="text-sm text-green-600 mt-1">
                              {activeUsers} active
                            </p>
                          </div>
                          <div className="bg-blue-100 p-3 rounded-full">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Stores</p>
                            <p className="text-3xl font-bold text-gray-900">{totalStores}</p>
                            <p className="text-sm text-blue-600 mt-1">
                              {allStores.filter((s: any) => s.status === 'active').length} active
                            </p>
                          </div>
                          <div className="bg-green-100 p-3 rounded-full">
                            <Store className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
                            <p className="text-sm text-purple-600 mt-1">
                              ${averageOrderValue.toFixed(2)} avg
                            </p>
                          </div>
                          <div className="bg-purple-100 p-3 rounded-full">
                            <ShoppingCart className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-3xl font-bold text-gray-900">
                              ${totalRevenue.toFixed(2)}
                            </p>
                            <p className="text-sm text-green-600 mt-1">
                              +12% from last month
                            </p>
                          </div>
                          <div className="bg-yellow-100 p-3 rounded-full">
                            <DollarSign className="h-6 w-6 text-yellow-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Clock className="h-5 w-5 mr-2" />
                          Pending Approvals
                        </CardTitle>
                        <CardDescription>
                          Users waiting for approval
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!Array.isArray(pendingUsers) || pendingUsers.length === 0 ? (
                          <p className="text-gray-500 text-center py-4">
                            No pending approvals
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {Array.isArray(pendingUsers) && pendingUsers.slice(0, 3).map((user: any) => (
                              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {user.fullName?.charAt(0) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium">{user.fullName}</p>
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => approveUserMutation.mutate(user.id)}
                                    disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-all duration-200"
                                  >
                                    {approveUserMutation.isPending ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => rejectUserMutation.mutate({ userId: user.id, reason: "Admin rejection" })}
                                    disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                                    className="border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all duration-200"
                                  >
                                    {rejectUserMutation.isPending ? (
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {Array.isArray(pendingUsers) && pendingUsers.length > 3 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveTab("pending")}
                                className="w-full"
                              >
                                View All ({pendingUsers.length})
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2" />
                          Recent Activity
                        </CardTitle>
                        <CardDescription>
                          Latest platform activities
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm">New store registered</p>
                              <p className="text-xs text-gray-500">2 hours ago</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm">Order #1234 completed</p>
                              <p className="text-xs text-gray-500">4 hours ago</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <div className="flex-1">
                              <p className="text-sm">New product added</p>
                              <p className="text-xs text-gray-500">6 hours ago</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "users" && (
                <div className="space-y-6">
                  {/* Search and Filters */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-80"
                        />
                      </div>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="banned">Banned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </div>

                  {/* Users Table */}
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(allUsers) && allUsers
                            .filter((user: any) => {
                              const matchesSearch = user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                  user.email?.toLowerCase().includes(searchTerm.toLowerCase());
                              const matchesStatus = filterStatus === "all" || user.status === filterStatus;
                              return matchesSearch && matchesStatus;
                            })
                            .map((user: any) => (
                              <TableRow key={user.id}>
                                <TableCell>
                                  <div className="flex items-center">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback>
                                        {user.fullName?.charAt(0) || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="ml-3">
                                      <p className="font-medium">{user.fullName}</p>
                                      <p className="text-sm text-gray-500">ID: {user.id}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">{user.role}</Badge>
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={user.status} />
                                </TableCell>
                                <TableCell>
                                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setShowUserDialog(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    {user.status === "banned" ? (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => unbanUserMutation.mutate(user.id)}
                                        disabled={unbanUserMutation.isPending}
                                      >
                                        <UserCheck className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button size="sm" variant="destructive">
                                            <Ban className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Ban User</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to ban {user.fullName}? This action can be reversed later.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => banUserMutation.mutate(user.id)}
                                              className="bg-red-600 hover:bg-red-700"
                                            >
                                              Ban User
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "stores" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search stores..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-80"
                        />
                      </div>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Store
                    </Button>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Store</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Products</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(allStores) && allStores
                            .filter((store: any) =>
                              store.name?.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((store: any) => (
                              <TableRow key={store.id}>
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                      <Store className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div className="ml-3">
                                      <p className="font-medium">{store.name}</p>
                                      <p className="text-sm text-gray-500">{store.description?.substring(0, 50)}...</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{store.type}</Badge>
                                </TableCell>
                                <TableCell>{store.ownerName || "N/A"}</TableCell>
                                <TableCell>
                                  <StatusBadge status={store.status || "active"} />
                                </TableCell>
                                <TableCell>{store.productCount || 0}</TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedStore(store);
                                        setShowStoreDialog(true);
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "pending" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending User Approvals</CardTitle>
                      <CardDescription>
                        Users waiting for admin approval to access the platform
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pendingUsers.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            All caught up!
                          </h3>
                          <p className="text-gray-500">
                            No pending user approvals at the moment.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Array.isArray(pendingUsers) && pendingUsers.map((user: any) => (
                            <Card key={user.id} className="border-l-4 border-l-yellow-400">
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <Avatar className="h-12 w-12">
                                      <AvatarFallback className="bg-yellow-100 text-yellow-600">
                                        {user.fullName?.charAt(0) || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="font-medium text-gray-900">{user.fullName}</h3>
                                      <p className="text-sm text-gray-500">{user.email}</p>
                                      <div className="flex items-center mt-2 space-x-4">
                                        <Badge variant="outline">{user.role}</Badge>
                                        <span className="text-xs text-gray-500">
                                          Applied: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex space-x-3">
                                    <Button
                                      onClick={() => approveUserMutation.mutate(user.id)}
                                      disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-all duration-200"
                                    >
                                      {approveUserMutation.isPending ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      ) : (
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                      )}
                                      {approveUserMutation.isPending ? "Approving..." : "Approve"}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => rejectUserMutation.mutate({ userId: user.id, reason: "Admin rejection" })}
                                      disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                                      className="disabled:opacity-50 transition-all duration-200"
                                    >
                                      {rejectUserMutation.isPending ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      ) : (
                                        <XCircle className="h-4 w-4 mr-2" />
                                      )}
                                      {rejectUserMutation.isPending ? "Rejecting..." : "Reject"}
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "products" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search products..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-80"
                        />
                      </div>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Store</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(allProducts) && allProducts
                            .filter((product: any) =>
                              product.name?.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((product: any) => (
                              <TableRow key={product.id}>
                                <TableCell>
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                      <Package className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div className="ml-3">
                                      <p className="font-medium">{product.name}</p>
                                      <p className="text-sm text-gray-500">{product.description?.substring(0, 50)}...</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{product.storeName || "N/A"}</TableCell>
                                <TableCell>${product.price}</TableCell>
                                <TableCell>{product.stock || 0}</TableCell>
                                <TableCell>
                                  <StatusBadge status={product.isActive ? "active" : "inactive"} />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Button size="sm" variant="outline">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "orders" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search orders..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-80"
                        />
                      </div>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(allOrders) && allOrders
                            .filter((order: any) => {
                              const matchesStatus = filterStatus === "all" || order.status === filterStatus;
                              return matchesStatus;
                            })
                            .map((order: any) => (
                              <TableRow key={order.id}>
                                <TableCell>
                                  <span className="font-mono text-sm">#{order.id}</span>
                                </TableCell>
                                <TableCell>{order.customerName || "N/A"}</TableCell>
                                <TableCell>${order.totalAmount || order.total || 0}</TableCell>
                                <TableCell>
                                  <StatusBadge status={order.status} />
                                </TableCell>
                                <TableCell>
                                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Button size="sm" variant="outline">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "coupons" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Coupon Management</h3>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Coupon
                    </Button>
                  </div>

                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Min Order</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(coupons) && coupons.map((coupon: any) => (
                            <TableRow key={coupon.id}>
                              <TableCell>
                                <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                  {coupon.code}
                                </code>
                              </TableCell>
                              <TableCell>
                                {coupon.discountType === 'percentage' ? 
                                  `${coupon.discountValue}%` : 
                                  `$${coupon.discountValue}`
                                }
                              </TableCell>
                              <TableCell>${coupon.minimumOrderAmount || 0}</TableCell>
                              <TableCell>
                                {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={coupon.isActive ? "active" : "inactive"} />
                              </TableCell>
                              <TableCell>
                                {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "Never"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "delivery" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Delivery Zone Management</h3>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Zone
                    </Button>
                  </div>

                  <Card>
                    <CardContent className="p-6">
                      {Array.isArray(deliveryZones) && deliveryZones.length === 0 ? (
                        <div className="text-center py-8">
                          <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No delivery zones configured
                          </h3>
                          <p className="text-gray-500 mb-4">
                            Set up delivery zones to manage shipping fees and coverage areas.
                          </p>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Zone
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Array.isArray(deliveryZones) && deliveryZones.map((zone: any) => (
                            <Card key={zone.id} className="border">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium">{zone.name}</h4>
                                    <p className="text-sm text-gray-500">
                                      {zone.minDistance}km - {zone.maxDistance}km
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Base fee: ${zone.baseFee} + ${zone.perKmRate}/km
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch 
                                      checked={zone.isActive} 
                                      className="data-[state=checked]:bg-green-600"
                                    />
                                    <Button size="sm" variant="outline">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">System Settings</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Platform Settings</CardTitle>
                        <CardDescription>
                          Configure general platform settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="maintenance">Maintenance Mode</Label>
                          <Switch id="maintenance" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="registration">Allow New Registrations</Label>
                          <Switch id="registration" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="notifications">Email Notifications</Label>
                          <Switch id="notifications" defaultChecked />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Commission Settings</CardTitle>
                        <CardDescription>
                          Set platform commission rates
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="store-commission">Store Commission (%)</Label>
                          <Input
                            id="store-commission"
                            type="number"
                            defaultValue="5"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="restaurant-commission">Restaurant Commission (%)</Label>
                          <Input
                            id="restaurant-commission"
                            type="number"
                            defaultValue="8"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="delivery-commission">Delivery Commission (%)</Label>
                          <Input
                            id="delivery-commission"
                            type="number"
                            defaultValue="3"
                            className="mt-1"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Payment Settings</CardTitle>
                        <CardDescription>
                          Configure payment options
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="cod">Cash on Delivery</Label>
                          <Switch id="cod" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="stripe">Stripe Payments</Label>
                          <Switch id="stripe" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="paypal">PayPal Payments</Label>
                          <Switch id="paypal" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Security Settings</CardTitle>
                        <CardDescription>
                          Manage security configurations
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                          <Input
                            id="session-timeout"
                            type="number"
                            defaultValue="60"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                          <Switch id="two-factor" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password-policy">Strong Password Policy</Label>
                          <Switch id="password-policy" defaultChecked />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>System Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Platform Version</Label>
                          <p className="mt-1 text-lg font-semibold">v2.1.0</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Database Status</Label>
                          <p className="mt-1 text-lg font-semibold text-green-600">Connected</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Last Backup</Label>
                          <p className="mt-1 text-lg font-semibold">{new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "analytics" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Platform Growth</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm">
                              <span>User Growth</span>
                              <span>85%</span>
                            </div>
                            <Progress value={85} className="mt-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm">
                              <span>Store Growth</span>
                              <span>72%</span>
                            </div>
                            <Progress value={72} className="mt-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm">
                              <span>Revenue Growth</span>
                              <span>91%</span>
                            </div>
                            <Progress value={91} className="mt-2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{totalUsers}</div>
                            <div className="text-sm text-gray-500">Total Users</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{totalStores}</div>
                            <div className="text-sm text-gray-500">Total Stores</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{totalOrders}</div>
                            <div className="text-sm text-gray-500">Total Orders</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{totalProducts}</div>
                            <div className="text-sm text-gray-500">Total Products</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {selectedUser.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.fullName}</h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline">{selectedUser.role}</Badge>
                    <StatusBadge status={selectedUser.status} />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">User ID</Label>
                  <p className="mt-1">{selectedUser.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phone</Label>
                  <p className="mt-1">{selectedUser.phone || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Address</Label>
                  <p className="mt-1">{selectedUser.address || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Joined Date</Label>
                  <p className="mt-1">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Store Detail Dialog */}
      <Dialog open={showStoreDialog} onOpenChange={setShowStoreDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Store Details</DialogTitle>
          </DialogHeader>
          {selectedStore && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Store className="h-8 w-8 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedStore.name}</h3>
                  <p className="text-gray-500">{selectedStore.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline">{selectedStore.type}</Badge>
                    <StatusBadge status={selectedStore.status || "active"} />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Store ID</Label>
                  <p className="mt-1">{selectedStore.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Owner</Label>
                  <p className="mt-1">{selectedStore.ownerName || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Address</Label>
                  <p className="mt-1">{selectedStore.address || "Not provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Products</Label>
                  <p className="mt-1">{selectedStore.productCount || 0}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}