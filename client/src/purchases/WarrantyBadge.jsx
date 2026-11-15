import { warrantyStatus } from './format.js';

export default function WarrantyBadge({ warrantyUntil }) {
  const status = warrantyStatus(warrantyUntil);
  return <span className={`warranty warranty-${status.key}`}>{status.label}</span>;
}
