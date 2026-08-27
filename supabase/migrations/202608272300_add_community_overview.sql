-- Admin dashboard, Communities module follow-up.
-- NOT YET APPLIED — write-only per instruction, wait for manual approval.
--
-- Corrects a gap in 202608272200: the community page hero overlay
-- (title/text) already reuses the existing label/description columns —
-- confirmed live, no new field needed there. But there is genuinely no
-- existing storage location for a LONGER "about this community" section
-- rendered below the hero (verified against the live communities/*.html
-- templates — only the short intro-copy paragraph exists, sourced from
-- `description`). This adds the one column that content needs.

alter table public.communities
  add column if not exists overview text;

comment on column public.communities.overview is
  'Longer "about this community" copy shown in its own section below the hero on communities/<key>.html — distinct from `description`, which is the short carousel/intro summary. Null/empty hides the section, same as it not existing today.';
