-- Prepared for a NEW, independent Goldie Supabase project; not deployed.
create table public.goldie_records (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in ('event','routine','list','document','contact','outing','gift','meal','household','medication','settings','activity','note','plan','message')),
 payload jsonb not null default '{}'::jsonb,
 revision bigint not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.goldie_record_grants (
 record_id uuid references public.goldie_records(id) on delete cascade,
 recipient_id uuid references auth.users(id) on delete cascade,
 permission text not null check (permission in ('read','write')),
 primary key(record_id,recipient_id)
);
create function public.goldie_owns_record(record uuid) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.goldie_records r where r.id = record and r.owner_id = auth.uid());
$$;
create function public.goldie_can_access(record uuid, writing boolean default false) returns boolean language sql stable security definer set search_path = '' as $$
 select public.goldie_owns_record(record) or exists(select 1 from public.goldie_record_grants g where g.record_id = record and g.recipient_id = auth.uid() and (not writing or g.permission = 'write'));
$$;
create function public.goldie_record_guard() returns trigger language plpgsql set search_path = '' as $$
 begin
 if new.owner_id is distinct from old.owner_id or new.id is distinct from old.id then raise exception 'Record ownership and identity are immutable'; end if;
 new.revision = old.revision + 1; new.updated_at = now(); return new;
 end;
$$;
create trigger goldie_record_guard before update on public.goldie_records for each row execute function public.goldie_record_guard();
alter table public.goldie_records enable row level security;
alter table public.goldie_record_grants enable row level security;
create policy record_read on public.goldie_records for select to authenticated using (public.goldie_can_access(id));
create policy record_create on public.goldie_records for insert to authenticated with check (owner_id = auth.uid());
create policy record_edit on public.goldie_records for update to authenticated using (public.goldie_can_access(id,true)) with check (public.goldie_can_access(id,true));
create policy record_delete on public.goldie_records for delete to authenticated using (owner_id = auth.uid());
create policy grants_read on public.goldie_record_grants for select to authenticated using (recipient_id = auth.uid() or public.goldie_owns_record(record_id));
create policy grants_create on public.goldie_record_grants for insert to authenticated with check (public.goldie_owns_record(record_id));
create policy grants_edit on public.goldie_record_grants for update to authenticated using (public.goldie_owns_record(record_id)) with check (public.goldie_owns_record(record_id));
create policy grants_delete on public.goldie_record_grants for delete to authenticated using (public.goldie_owns_record(record_id));

create table public.goldie_conversations (id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade, title text not null default '');
create table public.goldie_conversation_members (conversation_id uuid references public.goldie_conversations(id) on delete cascade, user_id uuid references auth.users(id) on delete cascade, primary key(conversation_id,user_id));
create table public.goldie_messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.goldie_conversations(id) on delete cascade, sender_id uuid not null references auth.users(id) on delete cascade, body text not null check (char_length(body) between 1 and 10000), created_at timestamptz not null default now());
create function public.goldie_owns_conversation(conversation uuid) returns boolean language sql stable security definer set search_path = '' as $$ select exists(select 1 from public.goldie_conversations where id = conversation and owner_id = auth.uid()); $$;
create function public.goldie_in_conversation(conversation uuid) returns boolean language sql stable security definer set search_path = '' as $$ select public.goldie_owns_conversation(conversation) or exists(select 1 from public.goldie_conversation_members where conversation_id = conversation and user_id = auth.uid()); $$;
alter table public.goldie_conversations enable row level security;
alter table public.goldie_conversation_members enable row level security;
alter table public.goldie_messages enable row level security;
create policy conversations_read on public.goldie_conversations for select to authenticated using (public.goldie_in_conversation(id));
create policy conversations_create on public.goldie_conversations for insert to authenticated with check (owner_id = auth.uid());
create policy conversations_delete on public.goldie_conversations for delete to authenticated using (owner_id = auth.uid());
create policy members_read on public.goldie_conversation_members for select to authenticated using (public.goldie_in_conversation(conversation_id));
create policy members_create on public.goldie_conversation_members for insert to authenticated with check (public.goldie_owns_conversation(conversation_id));
create policy members_delete on public.goldie_conversation_members for delete to authenticated using (public.goldie_owns_conversation(conversation_id));
create policy messages_read on public.goldie_messages for select to authenticated using (public.goldie_in_conversation(conversation_id));
create policy messages_create on public.goldie_messages for insert to authenticated with check (sender_id = auth.uid() and public.goldie_in_conversation(conversation_id));

-- Private uploads: path begins with authenticated owner UUID. Sharing needs a
-- server authorization check against a document grant before issuing signed URLs.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('goldie-documents','goldie-documents',false,20971520,array['application/pdf','image/jpeg','image/png','image/webp']);
create policy goldie_storage_read on storage.objects for select to authenticated using (bucket_id='goldie-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy goldie_storage_create on storage.objects for insert to authenticated with check (bucket_id='goldie-documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy goldie_storage_delete on storage.objects for delete to authenticated using (bucket_id='goldie-documents' and (storage.foldername(name))[1]=auth.uid()::text);
-- Explicit privileges: RLS is the authorization boundary, never a service role JWT.
grant select,insert,update,delete on public.goldie_records,public.goldie_record_grants to authenticated;
grant select,insert,delete on public.goldie_conversations,public.goldie_conversation_members to authenticated;
grant select,insert on public.goldie_messages to authenticated;
revoke all on function public.goldie_owns_record(uuid),public.goldie_can_access(uuid,boolean),public.goldie_owns_conversation(uuid),public.goldie_in_conversation(uuid) from public;
grant execute on function public.goldie_owns_record(uuid),public.goldie_can_access(uuid,boolean),public.goldie_owns_conversation(uuid),public.goldie_in_conversation(uuid) to authenticated;
