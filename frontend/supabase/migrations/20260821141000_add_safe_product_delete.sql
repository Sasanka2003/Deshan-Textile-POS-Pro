create or replace function public.delete_unused_product(
  p_business_id uuid,
  p_product_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_staff_id uuid;
  v_role_name text;
  v_product_name text;
begin
  select
    s.id,
    r.name
  into
    v_staff_id,
    v_role_name
  from public.staff s
  join public.roles r
    on r.id = s.role_id
  where s.auth_user_id = auth.uid()
    and s.business_id = p_business_id
    and s.is_active = true
  limit 1;

  if v_staff_id is null then
    raise exception 'Active staff account not found.';
  end if;

  if lower(coalesce(v_role_name, '')) <> 'manager' then
    raise exception 'Manager permission required.';
  end if;

  select p.name
  into v_product_name
  from public.products p
  where p.id = p_product_id
    and p.business_id = p_business_id;

  if v_product_name is null then
    raise exception 'Product not found.';
  end if;

  if exists (
    select 1
    from public.sale_items
    where product_id = p_product_id
  ) then
    raise exception
      'This product has sales history and cannot be deleted. Disable it instead.';
  end if;

  if exists (
    select 1
    from public.purchase_items
    where product_id = p_product_id
  ) then
    raise exception
      'This product has purchase history and cannot be deleted. Disable it instead.';
  end if;

  if exists (
    select 1
    from public.return_items
    where product_id = p_product_id
  ) then
    raise exception
      'This product has return history and cannot be deleted. Disable it instead.';
  end if;

  if exists (
    select 1
    from public.purchase_return_items
    where product_id = p_product_id
  ) then
    raise exception
      'This product has purchase return history and cannot be deleted. Disable it instead.';
  end if;

  if exists (
    select 1
    from public.stock_movements
    where product_id = p_product_id
  ) then
    raise exception
      'This product has stock movement history and cannot be deleted. Disable it instead.';
  end if;

  if exists (
    select 1
    from public.branch_stock
    where product_id = p_product_id
  ) then
    raise exception
      'This product has branch stock records and cannot be deleted. Disable it instead.';
  end if;

  if exists (
    select 1
    from public.held_bills
    where business_id = p_business_id
      and items::text like
        '%' || p_product_id::text || '%'
  ) then
    raise exception
      'This product is currently used in a held bill. Resume or remove that bill first.';
  end if;

  if exists (
    select 1
    from public.held_sales_legacy
    where business_id = p_business_id
      and items::text like
        '%' || p_product_id::text || '%'
  ) then
    raise exception
      'This product is referenced by a held sale and cannot be deleted.';
  end if;

  delete from public.products
  where id = p_product_id
    and business_id = p_business_id;

  if not found then
    raise exception 'Product could not be deleted.';
  end if;

  return jsonb_build_object(
    'deleted', true,
    'product_id', p_product_id,
    'product_name', v_product_name
  );
end;
$function$;

revoke all
on function public.delete_unused_product(uuid, uuid)
from public, anon;

grant execute
on function public.delete_unused_product(uuid, uuid)
to authenticated;
