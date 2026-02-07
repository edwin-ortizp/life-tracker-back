import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from './button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { cn } from '@/lib/utils';
import { ScrollArea } from './scroll-area';

export interface NativeMobileSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface NativeMobileSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: NativeMobileSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
}

export function NativeMobileSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar opción',
  disabled = false,
  className,
  label,
  description,
}: NativeMobileSelectProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState<string | undefined>(value);

  // Sync internal state with prop
  React.useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleSelect = (newValue: string) => {
    setSelectedValue(newValue);
    onChange?.(newValue);
    setOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === selectedValue);
  const displayValue = selectedOption?.label || placeholder;

  // Mobile: Use bottom drawer with native-like list
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-between text-left font-normal h-11',
              !selectedValue && 'text-muted-foreground',
              className
            )}
          >
            <span className="truncate">{displayValue}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{label || 'Seleccionar opción'}</DrawerTitle>
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <ScrollArea className="px-4 max-h-[60vh]">
            <div className="space-y-1 pb-4">
              {options.map((option) => (
                <button
                  key={option.value}
                  disabled={option.disabled}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  className={cn(
                    'flex w-full items-center rounded-lg px-4 py-3 text-left transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                    'disabled:pointer-events-none disabled:opacity-50',
                    'active:scale-[0.98] transition-transform',
                    selectedValue === option.value && 'bg-accent font-medium'
                  )}
                >
                  <span className="flex-1">{option.label}</span>
                  {selectedValue === option.value && (
                    <Check className="ml-2 h-5 w-5 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use standard Radix select
  return (
    <Select value={selectedValue} onValueChange={handleSelect} disabled={disabled}>
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}