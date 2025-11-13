import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="grid gap-1">
        <h1 className="font-headline text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-lg text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}
