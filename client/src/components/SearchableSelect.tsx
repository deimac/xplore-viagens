import { useState, useRef, useEffect, useMemo, useCallback } from "react";

export interface SearchableSelectOption {
    id: string | number;
    nome: string;
    tipo?: string;
    /** Linha extra de detalhe exibida abaixo do nome */
    detail?: string;
}

export interface SearchableSelectProps {
    options: SearchableSelectOption[];
    value: string;
    onChange: (id: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    /** Se informado, filtra somente itens com esse tipo */
    filterByTipo?: string;
    /** Renderização customizada de cada item (opcional) */
    renderItem?: (option: SearchableSelectOption, isSelected: boolean) => React.ReactNode;
    /** Callback quando o texto de busca muda (útil para sincronizar com busca server-side) */
    onSearchChange?: (search: string) => void;
    disabled?: boolean;
    className?: string;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Selecionar…",
    searchPlaceholder = "Buscar…",
    emptyMessage = "Nenhum resultado encontrado",
    filterByTipo,
    renderItem,
    onSearchChange,
    disabled = false,
    className = "",
}: SearchableSelectProps) {
    const [search, setSearchRaw] = useState("");

    const setSearch = useCallback((val: string) => {
        setSearchRaw(val);
        onSearchChange?.(val);
    }, [onSearchChange]);
    const [open, setOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // ---------- Filtro ----------
    const filteredOptions = useMemo(() => {
        let list = options;

        // Se filterByTipo informado, restringir por tipo
        if (filterByTipo) {
            list = list.filter((c) => c.tipo === filterByTipo);
        }

        if (search.trim()) {
            const term = search.toLowerCase();
            list = list.filter((c) => c.nome.toLowerCase().includes(term));
        }

        return list;
    }, [options, search, filterByTipo]);

    // ---------- Label do botão ----------
    const selectedOption = useMemo(
        () => options.find((c) => String(c.id) === value) ?? null,
        [options, value],
    );

    // ---------- Abrir / fechar ----------
    const openDropdown = useCallback(() => {
        if (disabled) return;
        setOpen(true);
        setHighlightIndex(-1);
        // Foco no input de busca após abrir
        requestAnimationFrame(() => searchInputRef.current?.focus());
    }, [disabled]);

    const closeDropdown = useCallback(() => {
        setOpen(false);
        setSearch("");
        setHighlightIndex(-1);
    }, []);

    const toggleDropdown = useCallback(() => {
        if (open) closeDropdown();
        else openDropdown();
    }, [open, closeDropdown, openDropdown]);

    // ---------- Selecionar ----------
    const handleSelect = useCallback(
        (id: string) => {
            onChange(id);
            closeDropdown();
        },
        [onChange, closeDropdown],
    );

    // ---------- Clique fora ----------
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                closeDropdown();
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open, closeDropdown]);

    // ---------- Teclado ----------
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                closeDropdown();
                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setHighlightIndex((prev) => {
                    const next = prev + 1;
                    return next >= filteredOptions.length ? 0 : next;
                });
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                setHighlightIndex((prev) => {
                    const next = prev - 1;
                    return next < 0 ? filteredOptions.length - 1 : next;
                });
                return;
            }

            if (e.key === "Enter" && highlightIndex >= 0 && highlightIndex < filteredOptions.length) {
                e.preventDefault();
                handleSelect(String(filteredOptions[highlightIndex].id));
            }
        },
        [closeDropdown, filteredOptions, highlightIndex, handleSelect],
    );

    // Scroll automático para o item destacado
    useEffect(() => {
        if (highlightIndex < 0 || !listRef.current) return;
        const items = listRef.current.querySelectorAll("[data-csf-item]");
        items[highlightIndex]?.scrollIntoView({ block: "nearest" });
    }, [highlightIndex]);

    // Reset highlight quando a lista muda
    useEffect(() => {
        setHighlightIndex(-1);
    }, [search]);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger / botão principal */}
            <button
                type="button"
                disabled={disabled}
                onClick={toggleDropdown}
                className={`
          flex w-full items-center justify-between rounded-md border border-input
          bg-background px-3 py-2 text-sm ring-offset-background
          hover:bg-accent hover:text-accent-foreground
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
          disabled:cursor-not-allowed disabled:opacity-50
          ${!selectedOption ? "text-muted-foreground" : ""}
        `}
                title={placeholder}
            >
                <span className="truncate text-left">
                    {selectedOption ? selectedOption.nome : placeholder}
                </span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`ml-2 shrink-0 opacity-50 transition-transform ${open ? "rotate-180" : ""}`}
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md"
                    onKeyDown={handleKeyDown}
                >
                    {/* Input de busca */}
                    <div className="border-b p-2">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
                            autoComplete="off"
                        />
                    </div>

                    {/* Lista de opções */}
                    <div ref={listRef} className="max-h-60 overflow-y-auto p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </div>
                        ) : (
                            filteredOptions.map((option, idx) => {
                                const isSelected = String(option.id) === value;
                                const isHighlighted = idx === highlightIndex;

                                if (renderItem) {
                                    return (
                                        <div
                                            key={option.id}
                                            data-csf-item
                                            onClick={() => handleSelect(String(option.id))}
                                            className={`cursor-pointer rounded-sm px-2 py-1.5 text-sm ${isHighlighted ? "bg-accent text-accent-foreground" : ""
                                                }`}
                                        >
                                            {renderItem(option, isSelected)}
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={option.id}
                                        data-csf-item
                                        onClick={() => handleSelect(String(option.id))}
                                        onMouseEnter={() => setHighlightIndex(idx)}
                                        className={`flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm ${isHighlighted ? "bg-accent text-accent-foreground" : ""
                                            }`}
                                    >
                                        <div className="flex flex-col min-w-0">
                                            <span className="truncate">{option.nome}</span>
                                            {option.detail && (
                                                <span className="truncate text-xs text-muted-foreground">{option.detail}</span>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="ml-2 shrink-0 text-primary"
                                            >
                                                <path d="M20 6 9 17l-5-5" />
                                            </svg>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
