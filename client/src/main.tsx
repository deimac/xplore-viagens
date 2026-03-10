import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Redireciona todos os domínios alternativos para o canônico (www.xploreviagens.com.br)
if (typeof window !== "undefined") {
    const { hostname, protocol, pathname, search, hash } = window.location;
    const canonicalHost = "www.xploreviagens.com.br";
    if (hostname !== canonicalHost && ["xploreviagens.com.br", "xploreviagens.com", "www.xploreviagens.com"].includes(hostname)) {
        window.location.replace(`${protocol}//${canonicalHost}${pathname}${search}${hash}`);
    }
}

createRoot(document.getElementById("root")!).render(<App />);
