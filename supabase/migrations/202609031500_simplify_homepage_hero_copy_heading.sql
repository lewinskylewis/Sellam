-- Simplifies the Homepage Hero title editor to a single line-sensitive
-- field. The dashboard previously had separate "Title — Line 1" / "Title —
-- Line 2" boxes backed by two columns; this collapses them into one
-- `heading` text column where a newline the admin types is a line break on
-- the live homepage (index.html renders one <span> per line — see
-- script.js's renderHeroTitleCopy). Preserves the existing row's content
-- exactly (line_1 + newline + line_2) rather than reseeding.

alter table public.homepage_hero_copy add column if not exists heading text;

update public.homepage_hero_copy
set heading = heading_line_1 || E'\n' || heading_line_2
where heading is null;

alter table public.homepage_hero_copy alter column heading set not null;

alter table public.homepage_hero_copy drop column if exists heading_line_1;
alter table public.homepage_hero_copy drop column if exists heading_line_2;

comment on table public.homepage_hero_copy is
  'Singleton row holding the homepage hero''s editable title (heading, newline-separated — index.html renders one <span> per line) and description paragraph. Does not touch the hero image carousel (homepage_hero_slides) in any way.';
