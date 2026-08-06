import { listInventoryV2, getInvV2Kpis } from '@/lib/crm/inventory-v2/model';
import { InventoryCenter } from '@/components/crm/InventoryCenter';

export const dynamic = 'force-dynamic';

export default async function InventoryCenterPage() {
  const [rows, kpis] = await Promise.all([listInventoryV2('', 'all', 1500), getInvV2Kpis()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">מרכז ניהול המלאי</h1>
        <p className="mt-1 text-sm text-cream/50">
          שליטה מלאה: מלאי, עלויות, רווחיות ואיכות-נתונים. פנימי ל-CRM בלבד — אפס השפעה על האתר.
        </p>
      </div>
      <InventoryCenter initialRows={rows} initialKpis={kpis} />
    </div>
  );
}
