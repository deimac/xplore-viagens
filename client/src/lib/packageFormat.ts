// Formatação do card de pacote (carrossel, lista e página /pacote/:code).

export const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const MONTHS: Record<string, string> = {
  "01": "jan", "02": "fev", "03": "mar", "04": "abr", "05": "mai", "06": "jun",
  "07": "jul", "08": "ago", "09": "set", "10": "out", "11": "nov", "12": "dez",
};

export const formatDate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  const iso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]} ${MONTHS[iso[2]] || iso[2]} ${iso[1]}`;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${date.getUTCDate().toString().padStart(2, "0")} ${MONTHS[month] || month} ${date.getUTCFullYear()}`;
};

export const calculateNights = (dataIda: string | null | undefined, dataVolta: string | null | undefined): number | null => {
  if (!dataIda || !dataVolta) return null;
  const start = new Date(dataIda);
  const end = new Date(dataVolta);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return nights > 0 ? nights : null;
};

export function buildViagemWhatsAppLink(viagem: any, rawNumber: string): string {
  const number = rawNumber.replace(/\D/g, "");
  const message = `Olá! Tenho interesse na viagem:\n\n` +
    `📋 Código: #${viagem.id}\n` +
    `✈️ ${viagem.titulo}\n` +
    `👥 ${viagem.quantidadePessoas} ${viagem.quantidadePessoas === 1 ? "viajante" : "viajantes"}\n` +
    `💰 ${formatCurrency(viagem.valorTotal)}\n\n` +
    `Gostaria de mais informações!`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
