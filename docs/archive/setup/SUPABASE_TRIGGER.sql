-- ============================================================================
-- RUN THIS IN SUPABASE DASHBOARD > SQL EDITOR
-- ============================================================================

-- 1. Create the function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public."User" (id, email, name, "createdAt", "updatedAt")
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', now(), now());
  return new;
end;
$$ language plpgsql security definer;

-- 2. Create the trigger on auth.users
-- Note: This trigger requires permissions on auth schema which Supabase SQL Editor has.
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Verify it works
-- You can sign up a new user in your App and check the public."User" table.
