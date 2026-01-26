import { CheckIcon, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import getExampleNumber from "libphonenumber-js/mobile/examples";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type PhoneInputProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
> &
    Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
        onChange?: (value: RPNInput.Value) => void;
    };

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
    React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
        ({ className, onChange, defaultCountry, placeholder: customPlaceholder, ...props }, ref) => {
            const [country, setCountry] = React.useState<RPNInput.Country | undefined>(defaultCountry);
            const [placeholder, setPlaceholder] = React.useState<string>("");

            // Atualizar placeholder quando o país muda ou no mount
            React.useEffect(() => {
                const currentCountry = country || defaultCountry;
                if (currentCountry) {
                    try {
                        const exampleNumber = getExampleNumber[currentCountry as keyof typeof getExampleNumber];
                        if (exampleNumber) {
                            setPlaceholder(exampleNumber);
                        } else {
                            setPlaceholder(customPlaceholder || "Digite seu telefone");
                        }
                    } catch (error) {
                        setPlaceholder(customPlaceholder || "Digite seu telefone");
                    }
                } else {
                    setPlaceholder(customPlaceholder || "Digite seu telefone");
                }
            }, [country, defaultCountry, customPlaceholder]);

            return (
                <RPNInput.default
                    ref={ref}
                    className={cn("flex", className)}
                    flagComponent={FlagComponent}
                    countrySelectComponent={CountrySelect}
                    inputComponent={InputComponent}
                    country={country}
                    onCountryChange={setCountry}
                    defaultCountry={defaultCountry}
                    placeholder={placeholder}
                    /**
                     * @handleOnChange
                     * Check for the value to be a valid phone number
                     */
                    onChange={(value) => onChange?.(value as RPNInput.Value)}
                    {...props}
                />
            );
        },
    );
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>(
    ({ className, ...props }, ref) => (
        <Input
            className={cn("rounded-e-lg rounded-s-none !placeholder:text-muted-foreground/50", className)}
            {...props}
            ref={ref}
        />
    ),
);
InputComponent.displayName = "InputComponent";

type CountrySelectOption = { label: string; value: RPNInput.Country };

type CountrySelectProps = {
    disabled?: boolean;
    value: RPNInput.Country;
    onChange: (value: RPNInput.Country) => void;
    options: CountrySelectOption[];
};

const CountrySelect = ({
    disabled,
    value,
    onChange,
    options,
}: CountrySelectProps) => {
    const handleSelect = React.useCallback(
        (country: RPNInput.Country) => {
            onChange(country);
        },
        [onChange],
    );

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant={"outline"}
                    className={cn("flex gap-1 rounded-e-none rounded-s-lg px-3")}
                    disabled={disabled}
                >
                    <FlagComponent country={value} countryName={value} />
                    <ChevronsUpDown
                        className={cn(
                            "-mr-2 h-4 w-4 opacity-50",
                            disabled ? "hidden" : "opacity-100",
                        )}
                    />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandList>
                        <CommandInput placeholder="Encontre o país..." />
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                            {options
                                .filter((x) => x.value)
                                .sort((a, b) => {
                                    // Brasil sempre primeiro
                                    if (a.value === "BR") return -1;
                                    if (b.value === "BR") return 1;
                                    // Depois em ordem alfabética
                                    return a.label.localeCompare(b.label);
                                })
                                .map((option) => (
                                    <CommandItem
                                        className="gap-2 cursor-pointer aria-selected:bg-muted/20 hover:!bg-muted/20"
                                        key={option.value}
                                        onSelect={() => handleSelect(option.value)}
                                    >
                                        <FlagComponent
                                            country={option.value}
                                            countryName={option.label}
                                        />
                                        <span className="flex-1 text-sm">{option.label}</span>
                                        {option.value && (
                                            <span className="text-foreground/50 text-sm">
                                                {`+${RPNInput.getCountryCallingCode(option.value)}`}
                                            </span>
                                        )}
                                        <CheckIcon
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                option.value === value ? "opacity-100" : "opacity-0",
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
    const Flag = flags[country];

    return (
        <>
            {Flag && <Flag title={countryName} />}
        </>
    );
};
FlagComponent.displayName = "FlagComponent";

export { PhoneInput };