// ============================================
// Sewanya iPhone — Form Validators
// ============================================

/**
 * Validasi field tidak kosong
 */
export function required(value, fieldName = 'Field') {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} wajib diisi`;
  }
  return null;
}

/**
 * Validasi nomor WhatsApp (format 08xx atau 628xx)
 */
export function validateWhatsApp(number) {
  if (!number) return 'Nomor WhatsApp wajib diisi';
  const clean = number.replace(/[^0-9]/g, '');
  if (clean.length < 10 || clean.length > 15) {
    return 'Nomor WhatsApp harus 10-15 digit';
  }
  if (!clean.startsWith('0') && !clean.startsWith('62')) {
    return 'Nomor WhatsApp harus dimulai dengan 0 atau 62';
  }
  return null;
}

/**
 * Validasi IMEI/Nomor Seri
 */
export function validateIMEI(imei) {
  if (!imei) return 'Nomor Seri/IMEI wajib diisi';
  if (imei.length < 5) return 'Nomor Seri/IMEI terlalu pendek';
  return null;
}

/**
 * Validasi harga (harus angka positif)
 */
export function validateHarga(harga) {
  const num = Number(harga);
  if (isNaN(num) || num <= 0) return 'Harga harus angka positif';
  return null;
}

/**
 * Validasi durasi (harus integer positif)
 */
export function validateDurasi(durasi) {
  const num = Number(durasi);
  if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
    return 'Durasi harus bilangan bulat positif';
  }
  return null;
}

/**
 * Validasi battery health (0-100)
 */
export function validateBattery(value) {
  const num = Number(value);
  if (isNaN(num) || num < 0 || num > 100) {
    return 'Battery health harus antara 0-100';
  }
  return null;
}

/**
 * Validasi tanggal tidak di masa lalu
 */
export function validateFutureDate(date, fieldName = 'Tanggal') {
  if (!date) return `${fieldName} wajib diisi`;
  const d = new Date(date);
  const now = new Date();
  now.setSeconds(0, 0);
  if (d < now) return `${fieldName} tidak boleh di masa lalu`;
  return null;
}

/**
 * Validasi tanggal selesai setelah tanggal mulai
 */
export function validateDateRange(start, end) {
  if (!start || !end) return 'Tanggal mulai dan selesai wajib diisi';
  const s = new Date(start);
  const e = new Date(end);
  if (e <= s) return 'Tanggal selesai harus setelah tanggal mulai';
  return null;
}

/**
 * Validate form fields, return errors object
 * @param {Object} rules - { fieldName: [validatorFn, ...] }
 * @returns {Object} errors - { fieldName: errorMessage }
 */
export function validateForm(rules) {
  const errors = {};
  for (const [field, validators] of Object.entries(rules)) {
    for (const validator of validators) {
      const error = validator();
      if (error) {
        errors[field] = error;
        break;
      }
    }
  }
  return errors;
}

/**
 * Check if errors object has any errors
 */
export function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}
