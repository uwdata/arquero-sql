export default function toArray(value) {
  return value != null ? (Array.isArray(value) ? value : [value]) : [];
}
