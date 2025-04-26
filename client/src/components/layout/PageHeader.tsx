import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backgroundClassName?: string;
  textClassName?: string;
  centered?: boolean;
}

export default function PageHeader({
  title,
  subtitle,
  backgroundClassName = "bg-muted/40",
  textClassName = "text-foreground",
  centered = false
}: PageHeaderProps) {
  return (
    <div className={`py-8 px-6 rounded-lg mb-8 ${backgroundClassName}`}>
      <div className={`container ${centered ? 'text-center' : ''}`}>
        <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${textClassName}`}>{title}</h1>
        {subtitle && (
          <p className="text-lg text-muted-foreground max-w-3xl">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}