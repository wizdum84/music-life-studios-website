import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  centered = false,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn(
      "mb-6 space-y-2",
      centered && "text-center",
      className
    )}>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-lg text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}