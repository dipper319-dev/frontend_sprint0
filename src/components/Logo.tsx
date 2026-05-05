import { Wallet } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
};

const textSizeMap = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

const iconSizeMap = {
  sm: 18,
  md: 24,
  lg: 32,
};

export function Logo({ size = "md", showText = true }: LogoProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${sizeMap[size]} rounded-2xl gradient-hero flex items-center justify-center shadow-elevated`}>
        <Wallet className="text-primary-foreground" size={iconSizeMap[size]} />
      </div>
      {showText && (
        <span className={`${textSizeMap[size]} font-bold text-foreground tracking-tight`}>
          FinanzApp
        </span>
      )}
    </div>
  );
}
