import { useState } from "react";

export default function ExampleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-8 relative">
                <button
                    className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-800"
                    onClick={onClose}
                    aria-label="Fechar"
                >
                    ×
                </button>
                <h2 className="text-2xl font-bold mb-4">Exemplo de Modal</h2>
                <p className="text-gray-700 mb-2">Este é um modal de exemplo, centralizado na tela, com fundo escurecido e botão de fechar.</p>
            </div>
        </div>
    );
}
