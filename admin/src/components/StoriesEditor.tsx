import { Field, inputClasses } from "./form";
import RepeatableCard, { AddCardButton } from "./RepeatableCard";

export type StoryItem = { _key: string; title: string; body: string };

export default function StoriesEditor({
  items,
  onChange,
}: {
  items: StoryItem[];
  onChange: (items: StoryItem[]) => void;
}) {
  function update(key: string, patch: Partial<StoryItem>) {
    onChange(items.map((i) => (i._key === key ? { ...i, ...patch } : i)));
  }
  function remove(key: string) {
    onChange(items.filter((i) => i._key !== key));
  }
  function add() {
    onChange([...items, { _key: Math.random().toString(36).slice(2), title: "", body: "" }]);
  }

  return (
    <div className="space-y-4">
      {items.length === 0 && <p className="text-sm text-ink-soft">No stories yet.</p>}
      {items.map((item, index) => (
        <RepeatableCard key={item._key} index={index} label="Story" onRemove={() => remove(item._key)}>
          <Field label="Title">
            <input
              className={inputClasses}
              value={item.title}
              onChange={(e) => update(item._key, { title: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={3}
              className={inputClasses}
              value={item.body}
              onChange={(e) => update(item._key, { body: e.target.value })}
            />
          </Field>
        </RepeatableCard>
      ))}
      <AddCardButton label="+ Add Story" onClick={add} />
    </div>
  );
}
