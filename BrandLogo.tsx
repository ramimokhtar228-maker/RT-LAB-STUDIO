import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = ''
}) => {
  const iconSize = size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <img
        src={`${import.meta.env.BASE_URL}logo.png`}
        alt="RT LABS"
        className={`${iconSize} rounded-2xl bg-black object-contain shrink-0 shadow-md shadow-rose-950/20`}
      />

      {showText && (
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className={`font-black text-slate-900 tracking-tight ${textSize}`}>
              معامل <span className="text-rose-900 font-extrabold">RT LAB</span>
            </span>
            <span className="text-[10px] font-extrabold bg-blue-900 text-white px-2 py-0.5 rounded-md shadow-2xs">
              معامل رامي مختار
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-bold truncate">
            للتحاليل التشخيصية والباثولوجيا الإكلينيكية
          </p>
        </div>
      )}
    </div>
  );
};
