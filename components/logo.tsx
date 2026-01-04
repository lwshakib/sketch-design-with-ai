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
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      {...rest}
    >
      <path
        fill={fill}
        d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"
      />
    </svg>
  );
};

export interface LogoProps {
  className?: string;
  iconSize?: number | string;
  textSize?: string;
}

export const Logo = ({
  className = "",
  iconSize = 24,
  textSize = "1.5rem",
}: LogoProps): React.ReactElement => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        style={{
          fontSize: textSize,
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}
        className="text-white"
      >
        Sketch
      </span>
      <div className="bg-zinc-800 text-[10px] px-2 py-0.5 rounded-full text-zinc-400 font-bold border border-zinc-700">
        BETA
      </div>
    </div>
  );
};
