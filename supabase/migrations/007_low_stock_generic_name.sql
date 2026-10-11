-- Migration 007: Include generic_name in get_low_stock_medicines RPC

create or replace function public.get_low_stock_medicines()
returns table (
  medicine_id   uuid,
  name          text,
  generic_name  text,
  strength      text,
  dosage_form   text,
  reorder_threshold int,
  total_stock   bigint
) language sql security definer as $$
  select
    m.id as medicine_id,
    m.name,
    m.generic_name,
    m.strength,
    m.dosage_form,
    m.reorder_threshold,
    coalesce(sum(b.quantity), 0) as total_stock
  from public.medicines m
  left join public.inventory_batches b on b.medicine_id = m.id
  where m.status = 'active'
  group by m.id, m.name, m.generic_name, m.strength, m.dosage_form, m.reorder_threshold
  having coalesce(sum(b.quantity), 0) <= m.reorder_threshold;
$$;
