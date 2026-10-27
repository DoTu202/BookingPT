// Display formatting shared by screens (Vietnamese conventions).

// 350000 -> "350.000 ₫". Implemented by hand because Intl support varies
// between Hermes builds.
export const formatCurrency = value => {
  const amount = Math.round(Number(value) || 0);
  return `${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`;
};

// 350000 -> "350k" for compact places such as list items.
export const formatCompactCurrency = value => {
  const amount = Number(value) || 0;
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}tr`;
  }
  return `${Math.round(amount / 1000)}k`;
};

// Accepts the API's {city, district} sub-document or a plain string.
export const formatLocation = (location, fallback = 'Chưa cập nhật khu vực') => {
  if (!location) {
    return fallback;
  }
  if (typeof location === 'string') {
    return location || fallback;
  }
  return [location.district, location.city].filter(Boolean).join(', ') || fallback;
};

export const formatHours = hours => {
  const value = Math.round((Number(hours) || 0) * 10) / 10;
  return `${String(value).replace('.', ',')} giờ`;
};

// "Vừa xong", "5 phút", "3 giờ", "Hôm qua", then "27/10".
export const formatRelativeTime = (iso, now = Date.now()) => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  const minutes = Math.floor((now - date.getTime()) / 60000);
  if (minutes < 1) {
    return 'Vừa xong';
  }
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} giờ`;
  }
  if (hours < 48) {
    return 'Hôm qua';
  }
  const local = new Date(date.getTime() + 7 * 3600000);
  return `${String(local.getUTCDate()).padStart(2, '0')}/${String(local.getUTCMonth() + 1).padStart(2, '0')}`;
};
