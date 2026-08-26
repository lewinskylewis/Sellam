import { Field, inputClasses } from "./form";
import RepeatableCard, { AddCardButton } from "./RepeatableCard";

export type HighlightItem = { _key: string; title: string; text: string };

export default function FeatureHighlightsEditor({
  items,
  onChange,
}: {
  items: HighlightItem[];
  onChange: (items: HighlightItem[]) => void;
}) {
  function update(key: string, patch: Partial<HighlightItem>) {
    onChange(items.map((i) => (i._key === key ? { ...i, ...patch } : i)));
  }
  function remove(key: string) {
    onChange(items.filter((i) => i._key !== key));
  }
  function add() {
    onChange([...items, { _key: Math.random().toString(36).slice(2), title: "", text: "" }]);
  }

  return (
    <div className="space-y-4">
      {items.length === 0 && <p className="text-sm text-ink-soft">No feature highlights yet.</p>}
      {items.map((item, index) => (
        <RepeatableCard key={item._key} index={index} label="Highlight" onRemove={() => remove(item._key)}>
          <Field label="Title" hint='e.g. "Location:", "Security:"'>
            <input
              className={inputClasses}
              value={item.title}
              onChange={(e) => update(item._key, { title: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={2}
              className={inputClasses}
              value={item.text}
              onChange={(e) => update(item._key, { text: e.target.value })}
            />
          </Field>
        </RepeatableCard>
      ))}
      <AddCardButton label="+ Add Highlight" onClick={add} />
    </div>
  );
}
