import Swal, { SweetAlertIcon } from 'sweetalert2';

/**
 * Mostra um alerta genérico.
 */
export const alerta = (title: string, text?: string, icon: SweetAlertIcon = 'info') => {
  return Swal.fire({
    icon,
    title,
    text,
    confirmButtonColor: '#3085d6',
    confirmButtonText: 'OK',
  });
};

/**
 * Mostra um alerta de sucesso.
 */
export const alertaSucesso = (message: string) => {
  return Swal.fire({
    icon: 'success',
    title: 'Sucesso!',
    text: message,
    confirmButtonColor: '#28a745',
  });
};

/**
 * Mostra um alerta de erro.
 */
export const alertaErro = (message: string) => {
  return Swal.fire({
    icon: 'error',
    title: 'Oops...',
    text: message,
    confirmButtonColor: '#dc3545',
  });
};

/**
 * Mostra um alerta de confirmação (retorna true/false).
 */
export const alertarConfirmar = async (message: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: 'Confirmação',
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#aaa',
  });
  return result.isConfirmed;
};

/**
 * Mostra um prompt numérico (ex: valor a pagar)
 */
export const pagarValorAlerta = async (title: string, label?: string, initialValue = 0) => {
  const { value } = await Swal.fire({
    title,
    input: 'number',
    inputLabel: label || '',
    inputValue: initialValue,
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
  });
  return value ? Number(value) : null;
};