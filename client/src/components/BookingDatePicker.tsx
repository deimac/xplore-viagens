import * as React from "react";
import { format, isBefore, startOfDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface BookingDatePickerProps {
    value?: DateRange;
    onChange?: (date: DateRange | undefined) => void;
    mode?: "flight" | "accommodation";
}

export function BookingDatePicker({ value, onChange, mode = "flight" }: BookingDatePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const isAccommodation = mode === "accommodation";

    const clearReturnDate = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newDate = { from: value?.from, to: undefined };
        onChange?.(newDate);
    };

    const handleDateSelect = (
        newDate: DateRange | undefined,
        selectedDay?: Date
    ) => {
        // If DayPicker cleared selection
        if (!newDate?.from) {
            onChange?.(undefined);
            return;
        }

        const clicked = selectedDay ?? newDate.from;

        // If both dates already selected, start a new range from the clicked date
        if (value?.from && value?.to) {
            onChange?.({ from: clicked, to: undefined });
            return;
        }

        // First click often comes as from/to the same day; keep only "from"
        if (!value?.from && newDate.from && newDate.to && newDate.from.getTime() === newDate.to.getTime()) {
            onChange?.({ from: clicked, to: undefined });
            return;
        }

        // Normal flow (setting return date or changing an in-progress selection)
        onChange?.(newDate);
    };

    const handleReset = () => {
        const newDate = undefined;
        onChange?.(newDate);
    };

    const handleConfirm = () => {
        setIsOpen(false);
    };

    return (
        <div className="flex flex-col gap-2">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full md:w-[480px] h-16 justify-start text-left font-normal border-primary/20 bg-card hover:bg-accent/5 rounded-2xl shadow-sm p-0 overflow-hidden",
                            !value?.from && "text-muted-foreground"
                        )}
                    >
                        <div className="flex items-center w-full h-full">
                            <div className="flex flex-col flex-1 px-5">
                                <span className="text-[10px] uppercase font-bold text-primary/60 tracking-wider">
                                    {isAccommodation ? "Check-in" : "Partida"}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <CalendarIcon className="h-4 w-4 text-primary" />
                                    <span className="font-semibold text-sm">
                                        {value?.from ? format(value.from, "dd 'de' MMM", { locale: ptBR }) : "Selecione"}
                                    </span>
                                </div>
                            </div>

                            <div className="h-8 w-[1px] bg-border/60" />

                            <div className="flex flex-col flex-1 px-5 relative group">
                                <span className="text-[10px] uppercase font-bold text-primary/60 tracking-wider">
                                    {isAccommodation ? "Check-out" : "Retorno"}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <CalendarIcon className={cn("h-4 w-4", value?.to ? "text-primary" : "text-primary/30")} />
                                    <span className={cn(
                                        "font-semibold text-sm",
                                        !value?.to && "text-muted-foreground font-normal italic"
                                    )}>
                                        {value?.to ? format(value.to, "dd 'de' MMM", { locale: ptBR }) : (isAccommodation ? "Selecione" : "Apenas ida")}
                                    </span>
                                </div>

                                {value?.to && !isAccommodation && (
                                    <button
                                        type="button"
                                        aria-label="Limpar data de retorno"
                                        onClick={clearReturnDate}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-destructive/10 rounded-full text-destructive"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto p-0 rounded-3xl shadow-2xl border-primary/10" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        selected={value}
                        onSelect={handleDateSelect}
                        numberOfMonths={2}
                        locale={ptBR}
                        disabled={(day) => isBefore(day, startOfDay(new Date()))}
                        classNames={{
                            day_range_middle: "bg-primary/10 text-primary",
                            day_selected: "bg-primary text-primary-foreground hover:bg-primary focus:bg-primary",
                            today: "text-primary data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground rounded-md",
                        }}
                    />

                    <div className="p-4 border-t border-border flex justify-between items-center bg-muted/5">
                        <div className="text-[11px] text-muted-foreground max-w-[200px]">
                            {isAccommodation
                                ? (value?.from && value?.to
                                    ? `Estadia de ${differenceInDays(value.to, value.from)} noite${differenceInDays(value.to, value.from) !== 1 ? 's' : ''}.`
                                    : value?.from
                                        ? "Selecione a data de check-out."
                                        : "Selecione as datas de check-in e check-out.")
                                : (value?.from && !value?.to ? "Selecione a volta ou clique em Confirmar para Apenas Ida." : "Selecione as datas.")}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                            >
                                Resetar
                            </Button>
                            <Button
                                size="sm"
                                className="bg-primary px-6"
                                onClick={handleConfirm}
                                disabled={isAccommodation && (!value?.from || !value?.to)}
                            >
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}