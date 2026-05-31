import React from "react";

interface InputMaskProps extends React.InputHTMLAttributes<HTMLInputElement> {
    mask: (value: string) => string;
}

export const InputMask = React.forwardRef<HTMLInputElement, InputMaskProps>(
    ({ mask, onChange, ...props }, ref) => {
        function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
            const masked = mask(e.target.value);
            e.target.value = masked;
            onChange?.(e);
        }
        return <input {...props} ref={ref} onChange={handleChange} />;
    }
);
InputMask.displayName = "InputMask";

// Máscara de hora HH:MM
export function maskHour(value: string) {
    let v = value.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + ":" + v.slice(2);
    return v;
}
