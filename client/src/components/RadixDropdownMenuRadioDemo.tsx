import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Circle } from 'lucide-react';

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  value?: string;
  onValueChange?: (val: string) => void;
}

const DropdownContext = React.createContext<DropdownContextType | undefined>(undefined);

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      <div ref={containerRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  asChild,
  className = ''
}: {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}) {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) return null;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        children.props.onClick?.(e);
        ctx.setIsOpen(!ctx.isOpen);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={() => ctx.setIsOpen(!ctx.isOpen)}
      className={`inline-flex items-center justify-between px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-800 shadow-2xs hover:bg-slate-50 transition active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className = '',
  side = 'bottom',
  align = 'start',
  sideOffset = 8,
  alignOffset = 0
}: {
  children: React.ReactNode;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
}) {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) return null;

  const getPositionClasses = () => {
    let base = 'absolute z-50 ';
    if (side === 'bottom') base += 'top-full ';
    if (side === 'top') base += 'bottom-full ';
    if (side === 'left') base += 'right-full ';
    if (side === 'right') base += 'left-full ';

    if (align === 'start') base += 'left-0 ';
    if (align === 'end') base += 'right-0 ';
    if (align === 'center') base += 'left-1/2 -translate-x-1/2 ';

    return base;
  };

  return (
    <AnimatePresence>
      {ctx.isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: side === 'top' ? 8 : -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: side === 'top' ? 8 : -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginTop: side === 'bottom' ? sideOffset : 0, marginBottom: side === 'top' ? sideOffset : 0 }}
          className={`${getPositionClasses()} min-w-[12rem] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md p-1.5 shadow-xl ring-1 ring-slate-950/5 ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DropdownMenuLabel({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-3 py-2 text-[11px] font-black tracking-wider text-slate-400 uppercase ${className}`}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className = '' }: { className?: string }) {
  return <div className={`-mx-1.5 my-1.5 h-px bg-slate-100 ${className}`} />;
}

interface RadioGroupContextType {
  value?: string;
  onValueChange?: (val: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextType | undefined>(undefined);

export function DropdownMenuRadioGroup({
  value,
  onValueChange,
  children
}: {
  value: string;
  onValueChange: (val: string) => void;
  children: React.ReactNode;
}) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className="space-y-0.5">{children}</div>
    </RadioGroupContext.Provider>
  );
}

export function DropdownMenuRadioItem({
  value,
  children,
  className = ''
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const groupCtx = React.useContext(RadioGroupContext);
  const dropdownCtx = React.useContext(DropdownContext);
  const isSelected = groupCtx?.value === value;

  const handleClick = () => {
    groupCtx?.onValueChange?.(value);
    dropdownCtx?.setIsOpen(false);
  };

  return (
    <motion.button
      type="button"
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`group relative flex w-full cursor-pointer select-none items-center rounded-xl px-3 py-2 text-xs font-extrabold outline-none transition-colors ${
        isSelected
          ? 'bg-amber-50 text-[#eb9800]'
          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
      } ${className}`}
    >
      <span className="mr-2 flex h-4 w-4 items-center justify-center">
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Circle className="h-2.5 w-2.5 fill-[#eb9800] text-[#eb9800]" />
          </motion.div>
        )}
      </span>
      <span className="flex-1 text-left">{children}</span>
      {isSelected && (
        <Check className="h-3.5 w-3.5 text-[#eb9800] ml-auto shrink-0" />
      )}
    </motion.button>
  );
}

// Demo Component matching requested specification
interface RadixDropdownMenuRadioDemoProps {
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  alignOffset?: number;
}

export function RadixDropdownMenuRadioDemo({
  side = 'bottom',
  sideOffset = 8,
  align = 'start',
  alignOffset = 0,
}: RadixDropdownMenuRadioDemoProps) {
  const [position, setPosition] = React.useState('bottom');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs shadow-md hover:shadow-lg transition flex items-center space-x-2">
          <span>Panel Position: <span className="uppercase text-white underline">{position}</span></span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
          <DropdownMenuRadioItem value="top">Top Position</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="bottom">Bottom Position</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="right">Right Position</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default RadixDropdownMenuRadioDemo;
