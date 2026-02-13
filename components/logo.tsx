import React, { SVGProps } from "react";

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

export interface LogoProps {
  className?: string;
  iconSize?: number | string;
  textSize?: string;
  showText?: boolean;
}

export const Logo = ({
  className = "",
  iconSize = 34,
  textSize = "1.5rem",
  showText = true,
}: LogoProps): React.ReactElement => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={iconSize} className="text-foreground" />
      {showText && (
        <span
          style={{
            fontSize: textSize,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
          className="text-foreground"
        >
          Sketch
        </span>
      )}

    </div>
  );
};
