import { useCallback, useRef, useState } from "react";
import { api } from "../api";

// Regras: (valor, todosOsValores) => mensagem de erro, "" se válido (pode ser assíncrona).
export const rules = {
  required: (msg = "Campo obrigatório.") => (v) => (String(v ?? "").trim() ? "" : msg),
  minLen: (n, msg) => (v) => (!v || String(v).length >= n ? "" : msg || `Use pelo menos ${n} caracteres.`),
  maxLen: (n, msg) => (v) => (!v || String(v).length <= n ? "" : msg || `Use no máximo ${n} caracteres.`),
  email: (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? "" : "Indique um e-mail válido."),
  teamUsername: (v) => (/^[^@\s]+@mbj\.inn$/i.test(String(v ?? "").trim()) ? "" : "O utilizador da equipa deve terminar com @mbj.inn."),
  phone: (v) => {
    if (!v) return "";
    const phoneNumber = Number(v);
    return /^\d{9}$/.test(String(v).trim()) && Number.isInteger(phoneNumber)
      && phoneNumber >= 100000000 && phoneNumber <= 999999999
      ? ""
      : "O telefone deve conter 9 algarismos e estar entre 100000000 e 999999999.";
  },
  password: (v) => (!v || String(v).length >= 8 ? "" : "A palavra-passe deve ter pelo menos 8 caracteres."),
  integer: (msg = "Indique um número inteiro válido.") => (v) => (
    v === "" || v == null || Number.isInteger(Number(v)) ? "" : msg
  ),
  min: (n, msg) => (v) => {
    if (v === "" || v == null) return "";
    const number = Number(v);
    return Number.isFinite(number) && number >= n ? "" : msg || `O valor mínimo é ${n}.`;
  },
  max: (n, msg) => (v) => {
    if (v === "" || v == null) return "";
    const number = Number(v);
    return Number.isFinite(number) && number <= n ? "" : msg || `O valor máximo é ${n}.`;
  },
  matches: (other, msg) => (v, all) => (!v || v === all[other] ? "" : msg),
  futureDate: (v) => {
    if (!v) return "";
    const date = new Date(v);
    return Number.isFinite(date.getTime()) && date > new Date() ? "" : "Escolha uma data futura.";
  },
  // Verifica no servidor se o e-mail está livre (só corre se o formato for válido).
  emailFree: async (v) => {
    if (!v || rules.email(v)) return "";
    try {
      const r = await api(`/auth/email-available?email=${encodeURIComponent(v.trim())}`, { skipAuth: true });
      return r?.available === false ? "Já existe uma conta com este e-mail." : "";
    } catch {
      return "";
    }
  },
};

export function passwordStrength(value = "") {
  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  return value ? Math.max(1, score) : 0;
}

/**
 * Formulário controlado com validação ao perder o foco.
 * field(nome) devolve as props do input; validateAll() valida tudo (útil ao submeter).
 */
export function useForm(initial, schema) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const latest = useRef(values);
  latest.current = values;
  const seq = useRef({});

  const check = useCallback(async (name, value, all) => {
    const token = (seq.current[name] = (seq.current[name] || 0) + 1);
    for (const rule of schema[name] || []) {
      const message = await rule(value, all);
      if (seq.current[name] !== token) return ""; // resposta antiga: ignora
      if (message) {
        setErrors((e) => ({ ...e, [name]: message }));
        return message;
      }
    }
    setErrors((e) => ({ ...e, [name]: "" }));
    return "";
  }, [schema]);

  const setValue = useCallback((name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
  }, []);

  const field = (name) => ({
    name,
    value: values[name] ?? "",
    className: `form-control ${errors[name] ? "is-invalid" : ""}`,
    "aria-invalid": errors[name] ? true : undefined,
    onChange: (e) => {
      setValue(name, e.target.value);
      // Depois de mostrar um erro, limpa-o assim que o utilizador corrige.
      if (errors[name]) check(name, e.target.value, { ...latest.current, [name]: e.target.value });
    },
    onBlur: (e) => check(name, e.target.value, latest.current),
  });

  const validateAll = async () => {
    const results = await Promise.all(Object.keys(schema).map((n) => check(n, latest.current[n], latest.current)));
    return results.every((m) => !m);
  };

  const reset = (next = initial) => {
    setValues(next);
    setErrors({});
  };

  return { values, setValue, setValues, errors, field, check, validateAll, reset };
}
