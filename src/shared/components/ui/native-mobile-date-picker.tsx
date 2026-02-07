import * as React from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from './button';
import { Calendar as CalendarComponent } from './calendar';
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
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { cn } from '@/lib/utils';

export interface NativeMobileDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function NativeMobileDatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha',
  disabled = false,
  className,
  minDate,
  maxDate,
}: NativeMobileDatePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);

  // Sync internal state with prop
  React.useEffect(() => {
    setSelectedDate(value);
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onChange?.(date);
    setOpen(false);
  };

  const formattedDate = selectedDate
    ? format(selectedDate, 'PPP', { locale: es })
    : placeholder;

  const calendarContent = (
    <CalendarComponent
      mode="single"
      selected={selectedDate}
      onSelect={handleSelect}
      disabled={disabled}
      fromDate={minDate}
      toDate={maxDate}
      initialFocus
    />
  );

  // Mobile: Use bottom drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground',
              className
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {formattedDate}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Seleccionar fecha</DrawerTitle>
            <DrawerDescription>
              Elige la fecha que desees
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {calendarContent}
          </div>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use popover
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground',
            className
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {formattedDate}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {calendarContent}
      </PopoverContent>
    </Popover>
  );
}