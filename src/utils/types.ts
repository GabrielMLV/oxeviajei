export const RECAPTCHA_SITE_KEY = "6LeIvAYsAAAAABzAvaB8MFO0HVjZAZHAnnCs6KfN";

export const formatarMoeda = (valor) => {
  if (!valor || valor <= 0) return "Não Definido";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};
