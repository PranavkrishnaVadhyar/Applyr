-- Run in the Supabase SQL editor as the project owner.
-- Idempotent; targets only resume resources. No resume rows/files are removed.
begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 10485760,
        array['application/pdf', 'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.resumes enable row level security;
alter table public.resume_content enable row level security;
grant select, insert, update, delete on public.resumes, public.resume_content to authenticated;

-- Restrictive policies cap pre-existing permissive policies as well.
drop policy if exists applyr_resume_owner_boundary on public.resumes;
create policy applyr_resume_owner_boundary on public.resumes as restrictive
for all to public using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists applyr_resume_owner_access on public.resumes;
create policy applyr_resume_owner_access on public.resumes
for all to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists applyr_content_owner_boundary on public.resume_content;
create policy applyr_content_owner_boundary on public.resume_content as restrictive
for all to public
using (exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = (select auth.uid())))
with check (exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = (select auth.uid())));
drop policy if exists applyr_content_owner_access on public.resume_content;
create policy applyr_content_owner_access on public.resume_content
for all to authenticated
using (exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = (select auth.uid())))
with check (exists (select 1 from public.resumes r where r.id = resume_id and r.user_id = (select auth.uid())));

drop policy if exists applyr_storage_resume_boundary on storage.objects;
create policy applyr_storage_resume_boundary on storage.objects as restrictive
for all to public
using (bucket_id <> 'resumes' or (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id <> 'resumes' or (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists applyr_storage_resume_access on storage.objects;
create policy applyr_storage_resume_access on storage.objects
for all to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- The API deletes parent resumes; content must be removed in the same DB transaction.
-- Stop rather than silently deploying against a schema that leaves orphan content.
do $$
begin
    if not exists (
        select 1 from pg_constraint c
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
        where c.contype = 'f' and c.conrelid = 'public.resume_content'::regclass
          and c.confrelid = 'public.resumes'::regclass
          and a.attname = 'resume_id' and c.confdeltype = 'c'
    ) then
        raise exception 'resume_content.resume_id must reference resumes.id with ON DELETE CASCADE. Update that foreign key, then rerun this migration.';
    end if;
end $$;

commit;
