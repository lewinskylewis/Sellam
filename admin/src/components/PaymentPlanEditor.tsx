import { Field, inputClasses } from "./form";
import RepeatableCard, { AddCardButton } from "./RepeatableCard";

export type PaymentPlanItemDraft = { _key: string; label: string; percent: string };

export default function PaymentPlanEditor({
  items,
  onChange,
}: {
  items: PaymentPlanItemDraft[];
  onChange: (items: PaymentPlanItemDraft[]) => void;
}) {
  function update(key: string, patch: Partial<PaymentPlanItemDraft>) {
    onChange(items.map((i) => (i._key === key ? { ...i, ...patch } : i)));
  }
  function remove(key: string) {
    onChange(items.filter((i) => i._key !== key));
  }
  function add() {
    onChange([...items, { _key: Math.random().toString(36).slice(2), label: "", percent: "" }]);
  }

  const total = items.reduce((sum, i) => sum + (Number(i.percent) || 0), 0);

  return (
    <div className="space-y-4">
      {items.length === 0 && <p className="text-sm text-ink-soft">No payment plan yet.</p>}
      {items.map((item, index) => (
        <RepeatableCard key={item._key} index={index} label="Payment Plan Item" onRemove={() => remove(item._key)}>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="Label" hint='e.g. "Reservation", "Upon Sale Agreement"'>
                <input
                  className={inputClasses}
                  value={item.label}
                  onChange={(e) => update(item._key, { label: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Percent">
              <input
                className={inputClasses}
                inputMode="decimal"
                value={item.percent}
                onChange={(e) => update(item._key, { percent: e.target.value })}
              />
            </Field>
          </div>
        </RepeatableCard>
      ))}
      <AddCardButton label="+ Add Payment Plan Item" onClick={add} />
      {items.length > 0 && (
        <p className={`text-xs ${total === 100 ? "text-ink-soft" : "text-amber-700"}`}>
          Total: {total}% {total !== 100 && "(payment plans are usually 100%)"}
        </p>
      )}
    </div>
  );
}
