import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Evita origin_mismatch no OAuth quando o usuário abre o domínio sem www.
if (typeof window !== "undefined") {
    const { hostname, protocol, pathname, search, hash } = window.location;
    if (hostname === "xploreviagens.com.br") {
        const target = `${protocol}//www.xploreviagens.com.br${pathname}${search}${hash}`;
        window.location.replace(target);
    }
}

createRoot(document.getElementById("root")!).render(<App />);
