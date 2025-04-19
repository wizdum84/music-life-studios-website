import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Booking, Service, Message, Beat, BeatPurchase } from "@shared/schema";
import { formatPrice } from "@/lib/utils";
import { 
  BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon, 
  TrendingUp, Users, Calendar, DollarSign, Music, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Clipboard, Download, MessageSquare
} from "lucide-react";
import { COLORS } from "@/lib/constants";

// Time period options for filtering
const TIME_PERIODS = [
  { label: "Last 7 Days", value: "7days" },
  { label: "Last 30 Days", value: "30days" },
  { label: "Last 3 Months", value: "3months" },
  { label: "Last Year", value: "1year" },
  { label: "All Time", value: "all" }
];

// KPI Card Component
const KpiCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon,
  trend = "neutral",
  description,
  onClick
}: { 
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  description?: string;
  onClick?: () => void;
}) => {
  return (
    <Card 
      className={`${onClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className={`rounded-full p-2 ${trend === "up" ? "bg-green-100" : trend === "down" ? "bg-red-100" : "bg-muted"}`}>
          <Icon size={18} className={trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs flex items-center mt-1 ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-muted-foreground"}`}>
            {trend === "up" ? <ArrowUpRight size={14} className="mr-1" /> : trend === "down" ? <ArrowDownRight size={14} className="mr-1" /> : null}
            {change > 0 ? "+" : ""}{change.toFixed(1)}% from previous period
          </p>
        )}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
};

export default function Analytics() {
  // State for filtering data
  const [period, setPeriod] = useState("30days");
  const [currentTab, setCurrentTab] = useState("overview");
  
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Fetch required data
  const { data: bookings = [] } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });
  
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });
  
  const { data: beats = [] } = useQuery<Beat[]>({
    queryKey: ['/api/beats'],
  });
  
  const { data: beatPurchases = [] } = useQuery<BeatPurchase[]>({
    queryKey: ['/api/beat-purchases'],
  });
  
  // Calculate date thresholds based on selected period
  const getDateThreshold = (): Date => {
    const now = new Date();
    
    switch (period) {
      case "7days":
        return new Date(now.setDate(now.getDate() - 7));
      case "30days":
        return new Date(now.setDate(now.getDate() - 30));
      case "3months":
        return new Date(now.setMonth(now.getMonth() - 3));
      case "1year":
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(0); // Return epoch time for "all"
    }
  };
  
  // Filter data based on selected time period
  const filterDataByPeriod = <T extends { createdAt?: Date | null }>(data: T[]): T[] => {
    const threshold = getDateThreshold();
    return data.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = new Date(item.createdAt);
      return itemDate >= threshold;
    });
  };
  
  // Filtered data based on selected period
  const filteredBookings = filterDataByPeriod(bookings);
  
  // Calculate KPI data
  const calculateKpis = () => {
    // Total Revenue
    const totalRevenue = filteredBookings.reduce((acc, booking) => {
      // Only count bookings that have been paid
      if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'deposit_paid') {
        // If deposit paid, count 25% of amount
        const paidAmount = booking.paymentStatus === 'deposit_paid' 
          ? booking.amount * 0.25
          : booking.amount;
        
        // If there's a discount amount, subtract it
        const discountAmount = booking.discountAmount || 0;
        
        return acc + paidAmount - discountAmount;
      }
      return acc;
    }, 0);
    
    // Beat sales revenue
    const beatSalesRevenue = beatPurchases.reduce((acc, purchase) => {
      return acc + purchase.price;
    }, 0);
    
    // Combined revenue
    const combinedRevenue = totalRevenue + beatSalesRevenue;
    
    // Average booking value
    const avgBookingValue = filteredBookings.length > 0 
      ? totalRevenue / filteredBookings.length 
      : 0;
    
    // Completed bookings count
    const completedBookings = filteredBookings.filter(b => b.status === 'completed').length;
    
    // Pending bookings count
    const pendingBookings = filteredBookings.filter(b => b.status === 'pending').length;
    
    // Cancelled bookings count
    const cancelledBookings = filteredBookings.filter(b => b.status === 'cancelled').length;
    
    // Beat sales count
    const beatSalesCount = beatPurchases.length;
    
    // New inquiries/messages
    const newInquiries = messages.length;
    
    // TODO: Calculate changes from previous period for trends
    // For now, use placeholder values
    const revenueChange = 12.5;
    const bookingsChange = 8.3;
    const messagesChange = -5.2;
    const beatSalesChange = 22.7;
    
    return {
      totalRevenue,
      beatSalesRevenue,
      combinedRevenue,
      avgBookingValue,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      beatSalesCount,
      newInquiries,
      revenueChange,
      bookingsChange,
      messagesChange,
      beatSalesChange
    };
  };
  
  // Get KPI data
  const kpis = calculateKpis();
  
  // Prepare data for charts
  
  // Revenue by service type
  const prepareRevenueByServiceData = () => {
    const serviceRevenueMap = new Map<number, { name: string; value: number }>();
    
    // Initialize map with all services
    services.forEach(service => {
      serviceRevenueMap.set(service.id, { name: service.name, value: 0 });
    });
    
    // Sum up revenue by service
    filteredBookings.forEach(booking => {
      if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'deposit_paid') {
        const serviceId = booking.serviceId;
        const service = serviceRevenueMap.get(serviceId);
        
        if (service) {
          const paidAmount = booking.paymentStatus === 'deposit_paid' 
            ? booking.amount * 0.25
            : booking.amount;
            
          service.value += paidAmount;
          serviceRevenueMap.set(serviceId, service);
        }
      }
    });
    
    return Array.from(serviceRevenueMap.values());
  };
  
  // Booking count by service
  const prepareBookingsByServiceData = () => {
    const serviceBookingsMap = new Map<number, { name: string; value: number }>();
    
    // Initialize map with all services
    services.forEach(service => {
      serviceBookingsMap.set(service.id, { name: service.name, value: 0 });
    });
    
    // Count bookings by service
    filteredBookings.forEach(booking => {
      const serviceId = booking.serviceId;
      const service = serviceBookingsMap.get(serviceId);
      
      if (service) {
        service.value += 1;
        serviceBookingsMap.set(serviceId, service);
      }
    });
    
    return Array.from(serviceBookingsMap.values());
  };
  
  // Montly revenue chart data
  const prepareMonthlyRevenueData = () => {
    const monthlyData: { name: string; services: number; beats: number; total: number }[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Get current month and past 11 months
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Create array of last 12 months
    for (let i = 11; i >= 0; i--) {
      let monthIndex = currentMonth - i;
      let year = currentYear;
      
      if (monthIndex < 0) {
        monthIndex += 12;
        year -= 1;
      }
      
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);
      
      // Calculate studio service revenue for this month
      let servicesRevenue = 0;
      filteredBookings.forEach(booking => {
        const bookingDate = new Date(booking.createdAt || 0);
        if (bookingDate >= startDate && bookingDate <= endDate) {
          if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'deposit_paid') {
            const paidAmount = booking.paymentStatus === 'deposit_paid' 
              ? booking.amount * 0.25
              : booking.amount;
              
            servicesRevenue += paidAmount;
          }
        }
      });
      
      // Calculate beat sales revenue for this month
      let beatsRevenue = 0;
      beatPurchases.forEach(purchase => {
        const purchaseDate = new Date(purchase.purchaseDate || 0);
        if (purchaseDate >= startDate && purchaseDate <= endDate) {
          beatsRevenue += purchase.price;
        }
      });
      
      monthlyData.push({
        name: `${monthNames[monthIndex]} ${year}`,
        services: servicesRevenue,
        beats: beatsRevenue,
        total: servicesRevenue + beatsRevenue
      });
    }
    
    return monthlyData;
  };
  
  // Beat sales by genre
  const prepareBeatSalesByGenreData = () => {
    const genreSalesMap = new Map<string, number>();
    
    // Count purchases by beat genre
    beatPurchases.forEach(purchase => {
      const beat = beats.find(b => b.id === purchase.beatId);
      if (beat) {
        const genre = beat.genre;
        const currentCount = genreSalesMap.get(genre) || 0;
        genreSalesMap.set(genre, currentCount + 1);
      }
    });
    
    return Array.from(genreSalesMap.entries()).map(([name, value]) => ({ name, value }));
  };
  
  // Monthly booking count data
  const prepareMonthlyBookingsData = () => {
    const monthlyData: { name: string; count: number }[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Get current month and past 11 months
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Create array of last 12 months
    for (let i = 11; i >= 0; i--) {
      let monthIndex = currentMonth - i;
      let year = currentYear;
      
      if (monthIndex < 0) {
        monthIndex += 12;
        year -= 1;
      }
      
      const startDate = new Date(year, monthIndex, 1);
      const endDate = new Date(year, monthIndex + 1, 0);
      
      // Count bookings for this month
      let bookingCount = 0;
      filteredBookings.forEach(booking => {
        const bookingDate = new Date(booking.createdAt || 0);
        if (bookingDate >= startDate && bookingDate <= endDate) {
          bookingCount += 1;
        }
      });
      
      monthlyData.push({
        name: `${monthNames[monthIndex]} ${year}`,
        count: bookingCount
      });
    }
    
    return monthlyData;
  };
  
  // Generate chart data
  const revenueByServiceData = prepareRevenueByServiceData();
  const bookingsByServiceData = prepareBookingsByServiceData();
  const monthlyRevenueData = prepareMonthlyRevenueData();
  const beatSalesByGenreData = prepareBeatSalesByGenreData();
  const monthlyBookingsData = prepareMonthlyBookingsData();
  
  // Custom chart colors
  const CHART_COLORS = [
    "#4C84FF", "#B4E1FF", "#95DE64", "#FFD666", "#FF7A45", 
    "#722ED1", "#2F54EB", "#13C2C2", "#1890FF", "#EB2F96"
  ];
  
  return (
    <div className="container mx-auto py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Business Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into studio performance and revenue streams
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              {TIME_PERIODS.map(period => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Export Data
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6" onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LineChartIcon size={16} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <Calendar size={16} />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <DollarSign size={16} />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="beats" className="flex items-center gap-2">
            <Music size={16} />
            Beat Sales
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard 
              title="Total Revenue" 
              value={formatPrice(kpis.combinedRevenue)}
              change={kpis.revenueChange}
              icon={DollarSign}
              trend="up"
            />
            <KpiCard 
              title="Total Bookings" 
              value={filteredBookings.length}
              change={kpis.bookingsChange}
              icon={Calendar}
              trend="up"
            />
            <KpiCard 
              title="Beat Sales" 
              value={kpis.beatSalesCount}
              change={kpis.beatSalesChange}
              icon={Music}
              trend="up"
            />
            <KpiCard 
              title="New Inquiries" 
              value={kpis.newInquiries}
              change={kpis.messagesChange}
              icon={MessageSquare}
              trend="down"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue breakdown by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="services" 
                        stackId="1"
                        stroke="#4C84FF" 
                        fill="#4C84FF" 
                        name="Studio Services"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="beats" 
                        stackId="1"
                        stroke="#95DE64" 
                        fill="#95DE64" 
                        name="Beat Sales"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Service Popularity</CardTitle>
                <CardDescription>Revenue distribution by service type</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueByServiceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {revenueByServiceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Booking Status</CardTitle>
                <CardDescription>Distribution of booking statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Completed', value: kpis.completedBookings },
                        { name: 'Pending', value: kpis.pendingBookings },
                        { name: 'Cancelled', value: kpis.cancelledBookings },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Bookings" fill="#4C84FF" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Beat Sales by Genre</CardTitle>
                <CardDescription>Distribution of beat purchases by genre</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={beatSalesByGenreData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {beatSalesByGenreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard 
              title="Total Bookings" 
              value={filteredBookings.length}
              icon={Calendar}
            />
            <KpiCard 
              title="Completed Bookings" 
              value={kpis.completedBookings}
              description={`${((kpis.completedBookings / (filteredBookings.length || 1)) * 100).toFixed(1)}% completion rate`}
              icon={Clipboard}
            />
            <KpiCard 
              title="Cancellation Rate" 
              value={`${((kpis.cancelledBookings / (filteredBookings.length || 1)) * 100).toFixed(1)}%`}
              icon={AlertTriangle}
              trend={((kpis.cancelledBookings / (filteredBookings.length || 1)) * 100) > 10 ? "down" : "up"}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Booking Trends</CardTitle>
                <CardDescription>Number of bookings per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyBookingsData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#4C84FF" 
                        name="Bookings"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Bookings by Service Type</CardTitle>
                <CardDescription>Distribution of bookings across services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bookingsByServiceData}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Bookings" fill="#4C84FF" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard 
              title="Total Revenue" 
              value={formatPrice(kpis.combinedRevenue)}
              icon={DollarSign}
            />
            <KpiCard 
              title="Studio Services Revenue" 
              value={formatPrice(kpis.totalRevenue)}
              description={`${((kpis.totalRevenue / kpis.combinedRevenue) * 100).toFixed(1)}% of total revenue`}
              icon={Users}
            />
            <KpiCard 
              title="Beat Sales Revenue" 
              value={formatPrice(kpis.beatSalesRevenue)}
              description={`${((kpis.beatSalesRevenue / kpis.combinedRevenue) * 100).toFixed(1)}% of total revenue`}
              icon={Music}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Monthly revenue by source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyRevenueData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Legend />
                      <Bar dataKey="services" name="Studio Services" stackId="a" fill="#4C84FF" />
                      <Bar dataKey="beats" name="Beat Sales" stackId="a" fill="#95DE64" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Service Revenue Distribution</CardTitle>
                <CardDescription>Revenue from different service offerings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={revenueByServiceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Bar 
                        dataKey="value" 
                        name="Revenue" 
                        fill="#4C84FF" 
                        label={{ position: 'top', formatter: (value: number) => `$${value}` }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth Trend</CardTitle>
              <CardDescription>Cumulative revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyRevenueData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#4C84FF" 
                      name="Total Revenue"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Beat Sales Tab */}
        <TabsContent value="beats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard 
              title="Total Beat Sales" 
              value={kpis.beatSalesCount}
              icon={Music}
            />
            <KpiCard 
              title="Beat Sales Revenue" 
              value={formatPrice(kpis.beatSalesRevenue)}
              icon={DollarSign}
            />
            <KpiCard 
              title="Avg. Beat Price" 
              value={formatPrice(kpis.beatSalesCount > 0 ? kpis.beatSalesRevenue / kpis.beatSalesCount : 0)}
              icon={TrendingUp}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Beat Sales by Genre</CardTitle>
                <CardDescription>Distribution of sales across music genres</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={beatSalesByGenreData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {beatSalesByGenreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Popular Beats</CardTitle>
                <CardDescription>Most purchased beats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] overflow-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Beat Name</th>
                        <th className="text-left py-2">Genre</th>
                        <th className="text-right py-2">Sales</th>
                        <th className="text-right py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beats.slice(0, 10).map(beat => {
                        const sales = beatPurchases.filter(p => p.beatId === beat.id);
                        const revenue = sales.reduce((acc, s) => acc + s.price, 0);
                        
                        return (
                          <tr key={beat.id} className="border-b hover:bg-muted/50">
                            <td className="py-2">{beat.title}</td>
                            <td className="py-2">{beat.genre}</td>
                            <td className="text-right py-2">{sales.length}</td>
                            <td className="text-right py-2">{formatPrice(revenue)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}