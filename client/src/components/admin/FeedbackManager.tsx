import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Star, EyeOff, Eye, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface Feedback {
  id: number;
  userId: number | null;
  bookingId: number | null;
  beatPurchaseId: number | null;
  rating: number;
  comment: string | null;
  serviceType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  name?: string;
  email?: string;
}

export default function FeedbackManager() {
  const [currentTab, setCurrentTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<number[]>([]);
  const { toast } = useToast();

  // Fetch all feedbacks
  const { data: feedbacks, isLoading, refetch } = useQuery<Feedback[]>({
    queryKey: ["/api/feedbacks"],
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Service type label map
  const serviceTypeLabels: { [key: string]: string } = {
    "session": "Recording Session",
    "mixing": "Mixing & Mastering",
    "production": "Production",
    "beat": "Beat Purchase",
  };

  // Filter feedbacks based on tab, search, and status
  const filteredFeedbacks = feedbacks
    ? feedbacks.filter((feedback) => {
        // Filter by tab (service type)
        if (currentTab !== "all" && feedback.serviceType !== currentTab) {
          return false;
        }
        
        // Filter by status
        if (statusFilter !== "all" && feedback.status !== statusFilter) {
          return false;
        }
        
        // Filter by search term
        const searchLower = searchTerm.toLowerCase();
        return (
          searchTerm === "" ||
          (feedback.comment && feedback.comment.toLowerCase().includes(searchLower)) ||
          (feedback.name && feedback.name.toLowerCase().includes(searchLower)) ||
          (feedback.email && feedback.email.toLowerCase().includes(searchLower))
        );
      })
    : [];
  
  // Toggle feedback selection
  const toggleFeedbackSelection = (id: number) => {
    setSelectedFeedbacks((prev) => 
      prev.includes(id) 
        ? prev.filter((feedbackId) => feedbackId !== id)
        : [...prev, id]
    );
  };
  
  // Toggle "select all" checkbox
  const toggleSelectAll = () => {
    if (selectedFeedbacks.length === filteredFeedbacks.length) {
      setSelectedFeedbacks([]);
    } else {
      setSelectedFeedbacks(filteredFeedbacks.map((feedback) => feedback.id));
    }
  };
  
  // Update feedback status
  const updateFeedbackStatus = async (id: number, status: string) => {
    try {
      await apiRequest("PUT", `/api/feedbacks/${id}/status`, { status });
      
      // Refetch data to get updated feedbacks
      refetch();
      
      toast({
        title: "Feedback updated",
        description: `Feedback has been ${status === "active" ? "shown" : "hidden"} successfully.`,
      });
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast({
        title: "Error",
        description: "There was a problem updating the feedback. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Delete feedback
  const deleteFeedback = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/feedbacks/${id}`);
      
      // Remove from selected feedback IDs if present
      setSelectedFeedbacks((prev) => prev.filter((feedbackId) => feedbackId !== id));
      
      // Refetch data to get updated feedbacks
      refetch();
      
      toast({
        title: "Feedback deleted",
        description: "Feedback has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast({
        title: "Error",
        description: "There was a problem deleting the feedback. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Bulk update feedback status
  const bulkUpdateStatus = async (status: string) => {
    try {
      // Create an array of promises for each update
      const updatePromises = selectedFeedbacks.map((id) => 
        apiRequest("PUT", `/api/feedbacks/${id}/status`, { status })
      );
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      // Refetch data to get updated feedbacks
      refetch();
      
      toast({
        title: "Feedback updated",
        description: `${selectedFeedbacks.length} feedbacks have been ${status === "active" ? "shown" : "hidden"} successfully.`,
      });
      
      // Clear selected feedbacks
      setSelectedFeedbacks([]);
    } catch (error) {
      console.error("Error updating feedbacks:", error);
      toast({
        title: "Error",
        description: "There was a problem updating the feedbacks. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Bulk delete feedbacks
  const bulkDelete = async () => {
    try {
      // Create an array of promises for each delete
      const deletePromises = selectedFeedbacks.map((id) => 
        apiRequest("DELETE", `/api/feedbacks/${id}`)
      );
      
      // Wait for all deletes to complete
      await Promise.all(deletePromises);
      
      // Refetch data to get updated feedbacks
      refetch();
      
      toast({
        title: "Feedback deleted",
        description: `${selectedFeedbacks.length} feedbacks have been deleted successfully.`,
      });
      
      // Clear selected feedbacks
      setSelectedFeedbacks([]);
    } catch (error) {
      console.error("Error deleting feedbacks:", error);
      toast({
        title: "Error",
        description: "There was a problem deleting the feedbacks. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Management</CardTitle>
        <CardDescription>
          View, moderate, and respond to client feedback
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setCurrentTab}>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="session">Recording</TabsTrigger>
              <TabsTrigger value="mixing">Mixing</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="beat">Beats</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedFeedbacks.length > 0 && (
            <div className="flex items-center justify-between bg-muted p-2 rounded-md mt-4">
              <span className="text-sm">
                {selectedFeedbacks.length} {selectedFeedbacks.length === 1 ? "item" : "items"} selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkUpdateStatus("active")}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  Show All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkUpdateStatus("hidden")}
                >
                  <EyeOff className="mr-1 h-4 w-4" />
                  Hide All
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={bulkDelete}
                >
                  <Trash className="mr-1 h-4 w-4" />
                  Delete All
                </Button>
              </div>
            </div>
          )}
          
          <TabsContent value={currentTab} className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredFeedbacks.length > 0 ? (
              <div className="max-h-[600px] overflow-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] text-center">
                        <Checkbox
                          checked={
                            filteredFeedbacks.length > 0 &&
                            selectedFeedbacks.length === filteredFeedbacks.length
                          }
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="w-[150px]">Date</TableHead>
                      <TableHead className="w-[140px]">Client</TableHead>
                      <TableHead className="w-[100px]">Rating</TableHead>
                      <TableHead className="w-[120px]">Service</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeedbacks.map((feedback) => (
                      <TableRow key={feedback.id}>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedFeedbacks.includes(feedback.id)}
                            onCheckedChange={() => toggleFeedbackSelection(feedback.id)}
                            aria-label={`Select feedback ${feedback.id}`}
                          />
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatDate(feedback.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {feedback.name || "Anonymous"}
                            </span>
                            {feedback.email && (
                              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {feedback.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= feedback.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {serviceTypeLabels[feedback.serviceType] || feedback.serviceType}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="truncate text-sm">
                            {feedback.comment || "No comment provided"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              feedback.status === "active"
                                ? "default"
                                : feedback.status === "flagged"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {feedback.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {feedback.status === "active" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateFeedbackStatus(feedback.id, "hidden")}
                            >
                              <EyeOff className="h-4 w-4" />
                              <span className="sr-only">Hide</span>
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateFeedbackStatus(feedback.id, "active")}
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">Show</span>
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteFeedback(feedback.id)}
                          >
                            <Trash className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No feedback found. {searchTerm && "Try a different search term."}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
