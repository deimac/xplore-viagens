import React from 'react';

interface PlaneIconProps {
  className?: string;
  animated?: boolean;
}

export const PlaneIcon: React.FC<PlaneIconProps> = ({ className = 'w-5 h-5', animated = true }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`${className} ${animated ? 'group-hover:animate-plane-takeoff transition-transform duration-500' : ''}`}
      style={animated ? { transformOrigin: 'center' } : {}}
    >
      {/* Fuselagem do avião */}
      <path d="M12 2 L14 8 L20 8 L15 12 L17 18 L12 14 L7 18 L9 12 L4 8 L10 8 Z" />
      
      {/* Alternativa: avião mais minimalista */}
      {/* <g>
        <path d="M12 1 L22 11 L12 13 L12 23 L10 13 L0 11 Z" />
      </g> */}
    </svg>
  );
};

export default PlaneIcon;
