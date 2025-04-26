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
  backgroundClassName = "bg-muted/30",
  textClassName = "",
  centered = false,
}: PageHeaderProps) {
  return (
    <div className={`w-full py-10 mb-6 ${backgroundClassName}`}>
      <div className={`container ${centered ? 'text-center' : ''}`}>
        <h1 className={`text-3xl md:text-4xl font-bold tracking-tight ${textClassName}`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`mt-3 text-lg text-muted-foreground max-w-3xl ${centered ? 'mx-auto' : ''}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}