import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface SignatureCanvasProps {
  onSignatureChange: (signature: string | null) => void;
  initialSignature?: string | null;
  height?: number;
  width?: string;
  backgroundColor?: string;
  penColor?: string;
}

export function SignatureCanvas({
  onSignatureChange,
  initialSignature = null,
  height = 200,
  width = "100%",
  backgroundColor = "#fff",
  penColor = "#000"
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = height;

    // Get context
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set default styles
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    setContext(ctx);

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
        onSignatureChange(initialSignature);
      };
      img.src = initialSignature;
    }

    // Handle window resize
    const handleResize = () => {
      if (!canvas || !ctx) return;
      
      // Save current canvas content
      const imageData = canvas.toDataURL();
      
      // Resize canvas
      canvas.width = canvas.offsetWidth;
      canvas.height = height;
      
      // Restore background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Restore canvas content
      if (imageData && hasSignature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = imageData;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [backgroundColor, height, initialSignature, onSignatureChange, penColor]);

  // Drawing functions
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!context) return;
    
    setIsDrawing(true);
    
    const { offsetX, offsetY } = getCoordinates(e);
    setLastPosition({ x: offsetX, y: offsetY });
    
    // Start a new path
    context.beginPath();
    context.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !context) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    
    // Draw line
    context.beginPath();
    context.moveTo(lastPosition.x, lastPosition.y);
    context.lineTo(offsetX, offsetY);
    context.stroke();
    
    setLastPosition({ x: offsetX, y: offsetY });
    setHasSignature(true);
  };

  const endDrawing = () => {
    if (!isDrawing || !context || !canvasRef.current) return;
    
    setIsDrawing(false);
    
    // Save signature
    const signatureData = canvasRef.current.toDataURL();
    onSignatureChange(signatureData);
  };

  const clearSignature = () => {
    if (!context || !canvasRef.current) return;
    
    // Clear canvas
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    setHasSignature(false);
    onSignatureChange(null);
  };

  // Helper to get coordinates from different event types
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    
    let offsetX = 0;
    let offsetY = 0;
    
    // Touch event
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
    } 
    // Mouse event
    else {
      offsetX = e.nativeEvent.offsetX;
      offsetY = e.nativeEvent.offsetY;
    }
    
    return { offsetX, offsetY };
  };

  return (
    <div className="signature-canvas-container" style={{ position: "relative", width }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: `${height}px`, cursor: "crosshair", backgroundColor }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
      />
      
      {hasSignature && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearSignature}
          className="absolute top-2 right-2 p-1 h-auto"
        >
          <RefreshCcw className="h-4 w-4" />
          <span className="sr-only">Clear signature</span>
        </Button>
      )}
    </div>
  );
}
