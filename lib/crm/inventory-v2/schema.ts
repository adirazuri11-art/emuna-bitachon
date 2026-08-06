// ============================================================
// Inventory "Million System" — סכימת מסד נתונים (feature/inventory-million-system-rebuild)
// ⚠️ CRM בלבד — אפס כתיבה לאתר. הכל additive (if not exists) → אפס סיכון לנתונים קיימים.
// המערכת הישנה נשמרת במלואה; המודול החדש מרחיב אותה ולא מוחק דבר.
// מקור אמת לכמות: inventory_movements. אין לשנות quantity_on_hand בלי תנועה.
// ============================================================

export const INVENTORY_V2_STATEMENTS: string[] = [
  // ---------- הרחבת inventory_items לכרטיס מוצר מלא ----------
  `alter table public.inventory_items add column if not exists internal_code text`,
  `alter table public.inventory_items add column if not exists short_name text`,
  `alter table public.inventory_items add column if not exists description text`,
  `alter table public.inventory_items add column if not exists internal_description text`,
  `alter table public.inventory_items add column if not exists supplier_id uuid`,
  `alter table public.inventory_items add column if not exists supplier_name text`,
  `alter table public.inventory_items add column if not exists brand text`,
  `alter table public.inventory_items add column if not exists category_id text`,
  `alter table public.inventory_items add column if not exists category_name text`,
  `alter table public.inventory_items add column if not exists crm_main_image_url text`,
  `alter table public.inventory_items add column if not exists image_gallery jsonb not null default '[]'::jsonb`,
  `alter table public.inventory_items add column if not exists product_status text not null default 'active'`,
  `alter table public.inventory_items add column if not exists internal_status text`,
  // כמויות מפוצלות — quantity_on_hand קיים (=סה"כ פיזי). good+damaged נגזרים ומתוחזקים בתנועות.
  `alter table public.inventory_items add column if not exists quantity_good int not null default 0`,
  `alter table public.inventory_items add column if not exists quantity_damaged int not null default 0`,
  `alter table public.inventory_items add column if not exists quantity_pending_receipt int not null default 0`,
  // נקודות רכש
  `alter table public.inventory_items add column if not exists minimum_stock int`,
  `alter table public.inventory_items add column if not exists reorder_point int`,
  `alter table public.inventory_items add column if not exists target_stock int`,
  `alter table public.inventory_items add column if not exists reorder_quantity int`,
  // מיקום במחסן
  `alter table public.inventory_items add column if not exists warehouse_location text`,
  `alter table public.inventory_items add column if not exists shelf_location text`,
  `alter table public.inventory_items add column if not exists bin_location text`,
  // עלויות (last_purchase_price + avg_cost כבר קיימים). כאן העלות המלאה.
  `alter table public.inventory_items add column if not exists purchase_cost_before_vat numeric(12,2)`,
  `alter table public.inventory_items add column if not exists purchase_cost_including_vat numeric(12,2)`,
  `alter table public.inventory_items add column if not exists additional_unit_cost numeric(12,2) not null default 0`,
  `alter table public.inventory_items add column if not exists landed_cost numeric(12,2)`,
  // מחירי מכירה — נקראים מהקטלוג (read-only). כאן override פנימי בלבד (null = השתמש בקטלוג).
  `alter table public.inventory_items add column if not exists retail_price_override numeric(12,2)`,
  `alter table public.inventory_items add column if not exists club_price_override numeric(12,2)`,
  `alter table public.inventory_items add column if not exists wholesale_price numeric(12,2)`,
  // מונים
  `alter table public.inventory_items add column if not exists total_returned int not null default 0`,
  `alter table public.inventory_items add column if not exists total_damaged int not null default 0`,
  `alter table public.inventory_items add column if not exists last_counted_at timestamptz`,
  `alter table public.inventory_items add column if not exists last_supplier_invoice_id uuid`,
  `alter table public.inventory_items add column if not exists tags text[] not null default '{}'`,
  `create index if not exists inv_items_supplier_idx on public.inventory_items (supplier_name)`,
  `create index if not exists inv_items_category_idx on public.inventory_items (category_name)`,
  `create index if not exists inv_items_barcode_idx on public.inventory_items (barcode)`,

  // ---------- תנועות מלאי — Idempotency + עלות + batch ----------
  `alter table public.inventory_movements add column if not exists idempotency_key text`,
  `alter table public.inventory_movements add column if not exists unit_cost numeric(12,2)`,
  `alter table public.inventory_movements add column if not exists batch_id text`,
  `alter table public.inventory_movements add column if not exists document_url text`,
  `alter table public.inventory_movements add column if not exists quality text`, // good | damaged
  `create unique index if not exists inv_moves_idem_idx on public.inventory_movements (idempotency_key) where idempotency_key is not null`,

  // ---------- Snapshots לאיפוס — PRE_RESET_INVENTORY_SNAPSHOT (הפיך) ----------
  `create table if not exists public.inventory_reset_snapshots (
    id            uuid primary key default gen_random_uuid(),
    batch_id      text not null unique,
    label         text not null default 'PRE_RESET_INVENTORY_SNAPSHOT',
    product_count int not null default 0,
    units_before  int not null default 0,
    value_at_cost numeric(14,2) not null default 0,
    payload       jsonb not null default '[]'::jsonb,
    status        text not null default 'created',
    created_by    text,
    created_at    timestamptz not null default now(),
    applied_at    timestamptz,
    rolled_back_at timestamptz
  )`,

  // ---------- ספירת מלאי ----------
  `create table if not exists public.stock_counts (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    scope       text,
    status      text not null default 'open',
    created_by  text,
    created_at  timestamptz not null default now(),
    closed_at   timestamptz
  )`,
  `create table if not exists public.stock_count_lines (
    id          uuid primary key default gen_random_uuid(),
    count_id    uuid not null references public.stock_counts(id) on delete cascade,
    sku         text not null,
    system_qty  int not null default 0,
    counted_qty int,
    diff        int,
    note        text,
    image_url   text,
    counted_at  timestamptz
  )`,
  `create index if not exists count_lines_count_idx on public.stock_count_lines (count_id)`,

  // ---------- רכש ----------
  `create table if not exists public.purchase_orders (
    id           uuid primary key default gen_random_uuid(),
    supplier_id  uuid,
    supplier_name text,
    status       text not null default 'draft',
    notes        text,
    expected_at  date,
    created_by   text,
    created_at   timestamptz not null default now()
  )`,
  `create table if not exists public.purchase_order_lines (
    id          uuid primary key default gen_random_uuid(),
    po_id       uuid not null references public.purchase_orders(id) on delete cascade,
    sku         text not null,
    quantity    int not null default 0,
    unit_cost_est numeric(12,2),
    created_at  timestamptz not null default now()
  )`,
  `create index if not exists po_lines_po_idx on public.purchase_order_lines (po_id)`,

  // ---------- פרופילי סריקה לפי ספק (לומד ומשתפר) ----------
  `create table if not exists public.supplier_parsing_profiles (
    id            uuid primary key default gen_random_uuid(),
    supplier_name text not null unique,
    config        jsonb not null default '{}'::jsonb,
    sample_count  int not null default 0,
    updated_at    timestamptz not null default now()
  )`,

  // ---------- גרסאות תמונה (היסטוריה + גלריה) — CRM בלבד, לא נוגע בתמונת האתר ----------
  `create table if not exists public.product_image_versions (
    id          uuid primary key default gen_random_uuid(),
    sku         text not null,
    image_url   text not null,
    is_main     boolean not null default false,
    source      text not null default 'crm_upload',
    created_by  text,
    created_at  timestamptz not null default now()
  )`,
  `create index if not exists img_versions_sku_idx on public.product_image_versions (sku, created_at desc)`,

  // ---------- הרחבת חשבוניות ספק — מסמך, ביטחון-סריקה, כפילות ----------
  `alter table public.supplier_invoices add column if not exists file_url text`,
  `alter table public.supplier_invoices add column if not exists page_count int`,
  `alter table public.supplier_invoices add column if not exists ocr_confidence numeric(5,2)`,
  `alter table public.supplier_invoices add column if not exists source_type text`, // invoice | delivery_note | credit_note | po
  `alter table public.supplier_invoices add column if not exists external_order_number text`,
  `alter table public.supplier_invoice_lines add column if not exists confidence numeric(5,2)`,
  `alter table public.supplier_invoice_lines add column if not exists raw_text text`,
  `alter table public.supplier_invoice_lines add column if not exists unit_of_measure text`,
  `alter table public.supplier_invoice_lines add column if not exists discount numeric(12,2)`,
  `alter table public.supplier_invoice_lines add column if not exists line_vat numeric(12,2)`,
];
