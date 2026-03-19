import React, { SVGProps } from "react";
import { Outfit } from "next/font/google";
import { cn } from "@/lib/utils";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export interface LogoIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
  fill?: string;
  size?: number | string;
}

export const LogoIcon = ({
  className,
  fill = "currentColor",
  size = 24,
  ...rest
}: LogoIconProps): React.ReactElement => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      {...rest}
    >
      <g fill={fill}>
        <circle cx="18" cy="18" r="14" opacity=".7" />
        <circle cx="30" cy="30" r="14" opacity=".7" />
      </g>
    </svg>
  );
};

export const CustomTextLogo = ({
  className = "",
  size = "1.5rem",
}: {
  className?: string;
  size?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex items-center select-none tracking-tighter",
        outfit.className,
        className,
      )}
      style={{ fontSize: size }}
    >
      <span className="font-black text-foreground transition-all duration-300 hover:tracking-normal">
        Ske
        <span className="from-primary to-primary/60 bg-gradient-to-br bg-clip-text text-transparent">
          tch
        </span>
      </span>
      <div className="bg-primary absolute -right-2 top-1 h-1.5 w-1.5 rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
    </div>
  );
};

export interface LogoProps {
  className?: string;
  iconSize?: number | string;
  textSize?: string;
  showText?: boolean;
}

export const Logo = ({
  className = "",
  textSize = "1.5rem",
}: LogoProps): React.ReactElement => {
  return (
    <div className={cn("flex items-center", className)}>
      <CustomTextLogo size={textSize} />
    </div>
  );
};
