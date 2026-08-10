create or replace function public.activate_membership(
  p_user_id uuid,
  p_cohort_id uuid,
  p_code_hash text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.activation_codes;
  v_membership_id uuid;
begin
  select * into v_code from public.activation_codes
  where cohort_id = p_cohort_id and code_hash = p_code_hash
  for update;
  if not found then raise exception 'INVALID_ACTIVATION_CODE'; end if;
  if v_code.used_at is not null then raise exception 'ACTIVATION_CODE_ALREADY_USED'; end if;

  insert into public.memberships (cohort_id, user_id)
  values (p_cohort_id, p_user_id)
  on conflict (cohort_id, user_id) do update set user_id = excluded.user_id
  returning id into v_membership_id;

  update public.activation_codes
  set used_by_user_id = p_user_id, used_at = timezone('utc', now())
  where id = v_code.id;
  return v_membership_id;
end;
$$;
