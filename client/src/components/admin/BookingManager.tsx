import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
} from "@radix-ui/react-icons";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Booking } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Calendar, Clock, Loader2, Mail, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const variant = (() => {
    switch (status) {
      case "confirmed": return "success";
      case "pending": return "warning";
      case "completed": return "default";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  })();
  
  return (
    <Badge variant={variant as any}>{status}</Badge>
  );
};

// Payment badge component
const PaymentBadge = ({ status }: { status: string }) => {
  const variant = (() => {
    switch (status) {
      case "paid": return "success";
      case "deposit_paid": return "warning";
      case "unpaid": return "outline";
      default: return "outline";
    }
  })();
  
  return (
    <Badge variant={variant as any}>{status.replace('_', ' ')}</Badge>
  );
};

export default function BookingManager() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { toast } = useToast();
  
  // Fetch bookings
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };
  
  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  };
  
  // Format time
  const formatTime = (dateString: string | Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(dateString));
  };
  
  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours + (mins > 0 ? `:${mins.toString().padStart(2, '0')}` : '') + ` ${hours === 1 ? 'hour' : 'hours'}`;
  };
  
  // Update booking status
  const updateBookingStatus = async () => {
    if (!selectedBooking || !newStatus) return;
    
    setIsUpdating(true);
    
    try {
      await apiRequest("PATCH", `/api/bookings/${selectedBooking.id}/status`, { status: newStatus });
      
      // Invalidate bookings query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      
      toast({
        title: "Status Updated",
        description: `Booking #${selectedBooking.id} status changed to ${newStatus}`,
      });
      
      setStatusUpdateOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle booking details view
  const viewBookingDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };
  
  // Handle status update dialog
  const openStatusUpdate = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewStatus(booking.status);
    setStatusUpdateOpen(true);
  };
  
  // Table columns definition
  const columns: ColumnDef<Booking>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
    },
    {
      accessorKey: "name",
      header: "Client",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-xs text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return (
          <div>
            <div>{formatDate(date)}</div>
            <div className="text-xs text-muted-foreground">{formatTime(date)}</div>
          </div>
        );
      },
      sortingFn: "datetime",
    },
    {
      accessorKey: "serviceId",
      header: "Service",
      cell: ({ row }) => {
        const serviceId = row.getValue("serviceId") as number;
        let serviceName = "Unknown";
        
        // In a real app, we would fetch services and map IDs to names
        if (serviceId === 1) serviceName = "Record With Wiz";
        if (serviceId === 2) serviceName = "Mix/Master With Wiz";
        if (serviceId === 3) serviceName = "Custom Production With Wiz";
        
        return <div>{serviceName}</div>;
      },
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => formatDuration(row.getValue("duration")),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => formatCurrency(row.getValue("amount")),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => <PaymentBadge status={row.getValue("paymentStatus")} />,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const booking = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => viewBookingDetails(booking)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openStatusUpdate(booking)}>
                Update Status
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Send Email</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  
  // Initialize table
  const table = useReactTable({
    data: bookings || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Booking Management</CardTitle>
          <CardDescription>
            View and manage all client bookings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4 gap-2">
            <Input
              placeholder="Filter by client name..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Status <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={
                    table.getColumn("status")?.getFilterValue() === undefined
                  }
                  onCheckedChange={() =>
                    table.getColumn("status")?.setFilterValue(undefined)
                  }
                >
                  All
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={
                    (table.getColumn("status")?.getFilterValue() as string[])?.includes(
                      "pending"
                    )
                  }
                  onCheckedChange={() => {
                    table.getColumn("status")?.setFilterValue(["pending"]);
                  }}
                >
                  Pending
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={
                    (table.getColumn("status")?.getFilterValue() as string[])?.includes(
                      "confirmed"
                    )
                  }
                  onCheckedChange={() => {
                    table.getColumn("status")?.setFilterValue(["confirmed"]);
                  }}
                >
                  Confirmed
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={
                    (table.getColumn("status")?.getFilterValue() as string[])?.includes(
                      "completed"
                    )
                  }
                  onCheckedChange={() => {
                    table.getColumn("status")?.setFilterValue(["completed"]);
                  }}
                >
                  Completed
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={
                    (table.getColumn("status")?.getFilterValue() as string[])?.includes(
                      "cancelled"
                    )
                  }
                  onCheckedChange={() => {
                    table.getColumn("status")?.setFilterValue(["cancelled"]);
                  }}
                >
                  Cancelled
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                        <p>No bookings found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} booking(s) total
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Booking Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Booking #{selectedBooking?.id} information
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center mb-2">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Client</h4>
                  </div>
                  <p className="text-sm">{selectedBooking.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.email}</p>
                </div>
                
                <div>
                  <div className="flex items-center mb-2">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <h4 className="text-sm font-medium">Session Date</h4>
                  </div>
                  <p className="text-sm">{formatDate(selectedBooking.date)}</p>
                  <p className="text-sm text-muted-foreground">{formatTime(selectedBooking.date)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Status</h4>
                  <StatusBadge status={selectedBooking.status} />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Payment</h4>
                  <PaymentBadge status={selectedBooking.paymentStatus} />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-1">Duration</h4>
                  <p className="text-sm">
                    {formatDuration(selectedBooking.duration)}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-1">Amount</h4>
                <p className="text-xl font-semibold">{formatCurrency(selectedBooking.amount)}</p>
              </div>
              
              {selectedBooking.details && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Project Details</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {selectedBooking.details}
                  </p>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between">
                <p className="text-xs text-muted-foreground">
                  Created: {formatDate(selectedBooking.createdAt)}, {formatTime(selectedBooking.createdAt)}
                </p>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Client
                  </Button>
                  <Button size="sm" onClick={() => {
                    setDetailsOpen(false);
                    openStatusUpdate(selectedBooking);
                  }}>
                    Update Status
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
            <DialogDescription>
              Change the status for booking #{selectedBooking?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Current Status</h4>
              <StatusBadge status={selectedBooking?.status || ""} />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">New Status</h4>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={updateBookingStatus} 
              disabled={isUpdating || newStatus === selectedBooking?.status}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
