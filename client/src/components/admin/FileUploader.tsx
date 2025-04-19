import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FileUploaderProps {
  accept?: string;
  maxSize?: number; // in MB
  onFileSelected?: (file: File) => void;
  onUploadComplete?: (url: string) => void;
  label?: string;
  description?: string;
  uploading?: boolean;
  uploadProgress?: number;
  uploadError?: string;
  uploadSuccess?: boolean;
  className?: string;
}

export default function FileUploader({
  accept = "audio/*,image/*",
  maxSize = 50, // 50MB
  onFileSelected,
  onUploadComplete,
  label = "Upload file",
  description = "Drag and drop or click to select a file",
  uploading = false,
  uploadProgress = 0,
  uploadError = "",
  uploadSuccess = false,
  className = "",
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateFile = (file: File): boolean => {
    // Check if the file type is accepted
    const fileType = file.type.split("/")[0];
    if (!accept.includes(fileType) && !accept.includes("*")) {
      setError(`File type not accepted. Please upload ${accept.replace(/\*/g, "any")} files.`);
      return false;
    }

    // Check if the file size is within limits
    const fileSize = file.size / (1024 * 1024); // Convert to MB
    if (fileSize > maxSize) {
      setError(`File is too large. Maximum size is ${maxSize}MB.`);
      return false;
    }

    return true;
  };

  const processFile = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      setError("");
      if (onFileSelected) {
        onFileSelected(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50",
          (uploading || uploadSuccess) && "pointer-events-none opacity-70"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          disabled={uploading || uploadSuccess}
        />
        
        <div className="flex flex-col items-center justify-center gap-3">
          {uploadSuccess ? (
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          ) : (
            <UploadCloud className={cn("h-10 w-10 text-muted-foreground", isDragging && "text-primary")} />
          )}
          
          {selectedFile && !uploadSuccess ? (
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium">{uploadSuccess ? "Upload complete!" : description}</p>
              <p className="text-xs text-muted-foreground">
                {uploadSuccess 
                  ? "Your file has been uploaded successfully"
                  : `Maximum file size: ${maxSize}MB`}
              </p>
            </div>
          )}
          
          {!uploadSuccess && (
            <Button 
              type="button" 
              variant="secondary" 
              size="sm"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : selectedFile ? "Choose a different file" : "Select File"}
            </Button>
          )}
        </div>
      </div>
      
      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            Uploading... {uploadProgress.toFixed(0)}%
          </p>
        </div>
      )}
      
      {(error || uploadError) && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || uploadError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}