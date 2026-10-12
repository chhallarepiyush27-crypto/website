-- Run once in the Supabase project's SQL editor. Re-running preserves data.
begin;
create schema if not exists reader_private;
revoke all on schema reader_private from public, anon, authenticated;

create table if not exists reader_private.comments (
  id bigint generated always as identity primary key,
  post_path text not null,
  user_id uuid references auth.users(id) on delete set null,
  request_id uuid not null,
  author_name text not null check (char_length(author_name) between 1 and 60),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (user_id, request_id)
);
create index if not exists reader_comments_post on reader_private.comments(post_path, id desc);
create index if not exists reader_comments_user on reader_private.comments(user_id, created_at);
create table if not exists reader_private.likes (
  post_path text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_path, user_id)
);
alter table reader_private.comments enable row level security;
alter table reader_private.likes enable row level security;
revoke all on all tables in schema reader_private from public, anon, authenticated;
revoke all on all sequences in schema reader_private from public, anon, authenticated;

create or replace function public.blog_conversation(p_post_path text, p_before bigint default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_comments jsonb; v_next bigint;
begin
  if p_post_path is null or char_length(p_post_path) > 300
     or p_post_path !~ '^/posts/[a-zA-Z0-9_-]+\.html$' then
    raise exception 'Invalid article';
  end if;
  select coalesce(jsonb_agg(to_jsonb(c) order by c.id desc), '[]'::jsonb), min(c.id)
    into v_comments, v_next from (
      select id, author_name, body, created_at from reader_private.comments
      where post_path = p_post_path and (p_before is null or id < p_before)
      order by id desc limit 20
    ) c;
  return jsonb_build_object(
    'comments', v_comments,
    'comment_count', (select count(*) from reader_private.comments where post_path = p_post_path),
    'like_count', (select count(*) from reader_private.likes where post_path = p_post_path),
    'liked', exists(select 1 from reader_private.likes where post_path = p_post_path and user_id = auth.uid()),
    'next_cursor', case when exists(select 1 from reader_private.comments where post_path = p_post_path and id < v_next) then v_next else null end
  );
end $$;

create or replace function public.blog_set_like(p_post_path text, p_liked boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Guest session required'; end if;
  if p_liked is null then raise exception 'Like state required'; end if;
  perform public.blog_conversation(p_post_path);
  perform pg_advisory_xact_lock(hashtext('blog-like:' || v_uid::text || ':' || p_post_path));
  if p_liked then
    insert into reader_private.likes(post_path, user_id) values (p_post_path, v_uid)
      on conflict (post_path, user_id) do nothing;
  else
    delete from reader_private.likes where post_path = p_post_path and user_id = v_uid;
  end if;
  return public.blog_conversation(p_post_path);
end $$;

create or replace function public.blog_add_comment(p_post_path text, p_author_name text, p_body text, p_request_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_name text := btrim(p_author_name); v_body text := btrim(p_body);
begin
  if v_uid is null then raise exception 'Guest session required'; end if;
  if p_request_id is null then raise exception 'Request ID required'; end if;
  if v_name is null or char_length(v_name) not between 1 and 60
    or v_body is null or char_length(v_body) not between 1 and 2000 then
    raise exception 'Enter a name and a comment of up to 2000 characters';
  end if;
  perform public.blog_conversation(p_post_path);
  perform pg_advisory_xact_lock(hashtext('blog-comment:' || v_uid::text));
  if exists(select 1 from reader_private.comments where user_id = v_uid and request_id = p_request_id) then
    if not exists(select 1 from reader_private.comments where user_id = v_uid and request_id = p_request_id
      and post_path = p_post_path and author_name = v_name and body = v_body) then
      raise exception 'Request ID already used';
    end if;
    return public.blog_conversation(p_post_path);
  end if;
  if exists(select 1 from reader_private.comments where user_id = v_uid and created_at > now() - interval '15 seconds') then
    raise exception 'Please wait 15 seconds before posting again';
  end if;
  if (select count(*) from reader_private.comments where user_id = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Daily comment limit reached. Please come back tomorrow';
  end if;
  insert into reader_private.comments(post_path, user_id, request_id, author_name, body)
    values (p_post_path, v_uid, p_request_id, v_name, v_body);
  return public.blog_conversation(p_post_path);
end $$;

revoke all on function public.blog_conversation(text, bigint) from public, anon, authenticated;
revoke all on function public.blog_set_like(text, boolean) from public, anon, authenticated;
revoke all on function public.blog_add_comment(text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.blog_conversation(text, bigint) to anon, authenticated;
grant execute on function public.blog_set_like(text, boolean) to authenticated;
grant execute on function public.blog_add_comment(text, text, text, uuid) to authenticated;
commit;
