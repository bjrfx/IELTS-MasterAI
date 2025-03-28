import { ReactNode } from "react";
import { Link } from "wouter";
import { ExternalLink, ArrowUpRight, ArrowDownRight, ArrowRight } from "lucide-react";

interface DashboardCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  to?: string;
  className?: string;
  gradient?: boolean;
  bordered?: boolean;
  children?: ReactNode;
}

export function DashboardCard({
  title,
  description,
  icon,
  footer,
  onClick,
  to,
  className = "",
  gradient = false,
  bordered = true,
  children
}: DashboardCardProps) {
  const cardClasses = `
    relative overflow-hidden rounded-xl p-6 w-full h-full
    ${gradient 
      ? 'bg-gradient-to-br from-primary to-primary/80 text-white' 
      : 'bg-white text-gray-900'
    }
    ${bordered && !gradient ? 'border border-gray-200' : ''}
    ${onClick || to ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}
    flex flex-col
    ${className}
  `.trim();
  
  const cardContent = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`font-semibold ${gradient ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          {description && (
            <p className={`mt-1 text-sm ${gradient ? 'text-white/90' : 'text-gray-500'}`}>
              {description}
            </p>
          )}
        </div>
        {icon && (
          <div className={`rounded-full p-2 ${gradient ? 'bg-white/20' : 'bg-primary/10'}`}>
            {icon}
          </div>
        )}
      </div>
      
      {children && <div className="mt-4">{children}</div>}
      
      {footer && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {footer}
        </div>
      )}
      
      {to && (
        <div className="absolute bottom-3 right-3">
          <ArrowRight className={`h-4 w-4 ${gradient ? 'text-white/70' : 'text-gray-400'}`} />
        </div>
      )}
    </>
  );
  
  if (to) {
    return (
      <Link href={to} className={cardClasses}>
        {cardContent}
      </Link>
    );
  }
  
  if (onClick) {
    return (
      <div className={cardClasses} onClick={onClick}>
        {cardContent}
      </div>
    );
  }
  
  return (
    <div className={cardClasses}>
      {cardContent}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  trend?: "up" | "down" | "neutral";
  description?: string;
  icon?: ReactNode;
  to?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  trend = "neutral",
  description,
  icon,
  to,
  className = ""
}: StatsCardProps) {
  const trendIcon = trend === "up" 
    ? <ArrowUpRight className="h-4 w-4 text-green-500" />
    : trend === "down" 
      ? <ArrowDownRight className="h-4 w-4 text-red-500" />
      : null;
  
  const trendColor = trend === "up" 
    ? "text-green-500" 
    : trend === "down" 
      ? "text-red-500" 
      : "text-gray-500";
  
  return (
    <DashboardCard
      title={title}
      icon={icon}
      to={to}
      className={`h-full ${className}`}
    >
      <div className="mt-4">
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">{value}</span>
          {change && (
            <span className={`ml-2 flex items-center text-sm font-medium ${trendColor}`}>
              {trendIcon}
              {change}
            </span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>
      
      {to && (
        <div className="mt-4 flex items-center text-xs font-medium text-primary hover:underline">
          <span>View details</span>
          <ExternalLink className="ml-1 h-3 w-3" />
        </div>
      )}
    </DashboardCard>
  );
}