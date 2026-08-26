import { Field, inputClasses } from "./form";
import RepeatableCard, { AddCardButton } from "./RepeatableCard";

export type LeaseZoneDraft = { _key: string; name: string; floors: string; minPerSqFt: string; maxPerSqFt: string };

export type LeasePricingDraft = {
  fromPerSqFtMin: string;
  fromPerSqFtMax: string;
  spaceAvailableMin: string;
  spaceAvailableMax: string;
  spaceAvailableUnit: string;
  parkingRatio: string;
  parkingNote: string;
  serviceChargePerSqFt: string;
  serviceChargeNote: string;
  saleAndLeaseAvailable: boolean;
  zones: LeaseZoneDraft[];
};

export function blankLeasePricing(): LeasePricingDraft {
  return {
    fromPerSqFtMin: "",
    fromPerSqFtMax: "",
    spaceAvailableMin: "",
    spaceAvailableMax: "",
    spaceAvailableUnit: "",
    parkingRatio: "",
    parkingNote: "",
    serviceChargePerSqFt: "",
    serviceChargeNote: "",
    saleAndLeaseAvailable: false,
    zones: [],
  };
}

export default function LeasePricingEditor({
  value,
  onChange,
}: {
  value: LeasePricingDraft;
  onChange: (value: LeasePricingDraft) => void;
}) {
  function set<K extends keyof LeasePricingDraft>(key: K, v: LeasePricingDraft[K]) {
    onChange({ ...value, [key]: v });
  }
  function updateZone(key: string, patch: Partial<LeaseZoneDraft>) {
    onChange({ ...value, zones: value.zones.map((z) => (z._key === key ? { ...z, ...patch } : z)) });
  }
  function removeZone(key: string) {
    onChange({ ...value, zones: value.zones.filter((z) => z._key !== key) });
  }
  function addZone() {
    onChange({
      ...value,
      zones: [...value.zones, { _key: Math.random().toString(36).slice(2), name: "", floors: "", minPerSqFt: "", maxPerSqFt: "" }],
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-ink-soft">
        Only shown for office/commercial-style properties. Leave every field blank if this property has no lease pricing.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="From Price / sq ft (min)">
          <input
            className={inputClasses}
            inputMode="decimal"
            value={value.fromPerSqFtMin}
            onChange={(e) => set("fromPerSqFtMin", e.target.value)}
          />
        </Field>
        <Field label="From Price / sq ft (max)">
          <input
            className={inputClasses}
            inputMode="decimal"
            value={value.fromPerSqFtMax}
            onChange={(e) => set("fromPerSqFtMax", e.target.value)}
          />
        </Field>
        <Field label="Space Available (min)">
          <input
            className={inputClasses}
            inputMode="decimal"
            value={value.spaceAvailableMin}
            onChange={(e) => set("spaceAvailableMin", e.target.value)}
          />
        </Field>
        <Field label="Space Available (max)">
          <input
            className={inputClasses}
            inputMode="decimal"
            value={value.spaceAvailableMax}
            onChange={(e) => set("spaceAvailableMax", e.target.value)}
          />
        </Field>
        <Field label="Space Unit" hint='e.g. "sq. ft."'>
          <input className={inputClasses} value={value.spaceAvailableUnit} onChange={(e) => set("spaceAvailableUnit", e.target.value)} />
        </Field>
        <Field label="Service Charge / sq ft">
          <input
            className={inputClasses}
            inputMode="decimal"
            value={value.serviceChargePerSqFt}
            onChange={(e) => set("serviceChargePerSqFt", e.target.value)}
          />
        </Field>
        <Field label="Service Charge Note" hint='e.g. "+ VAT"'>
          <input className={inputClasses} value={value.serviceChargeNote} onChange={(e) => set("serviceChargeNote", e.target.value)} />
        </Field>
        <Field label="Parking Ratio" hint='e.g. "2 bays : 1,000 sq. ft."'>
          <input className={inputClasses} value={value.parkingRatio} onChange={(e) => set("parkingRatio", e.target.value)} />
        </Field>
        <Field label="Parking Note" hint='e.g. "at a cost"'>
          <input className={inputClasses} value={value.parkingNote} onChange={(e) => set("parkingNote", e.target.value)} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input
          type="checkbox"
          checked={value.saleAndLeaseAvailable}
          onChange={(e) => set("saleAndLeaseAvailable", e.target.checked)}
          className="h-4 w-4 rounded border-line accent-brand"
        />
        Available for both sale and lease
      </label>

      <div>
        <p className="mb-3 text-sm font-medium text-ink">Pricing Zones</p>
        <div className="space-y-4">
          {value.zones.length === 0 && <p className="text-sm text-ink-soft">No zones (single flat rate above).</p>}
          {value.zones.map((zone, index) => (
            <RepeatableCard key={zone._key} index={index} label="Zone" onRemove={() => removeZone(zone._key)}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" hint='e.g. "Low Zone"'>
                  <input className={inputClasses} value={zone.name} onChange={(e) => updateZone(zone._key, { name: e.target.value })} />
                </Field>
                <Field label="Floors" hint='e.g. "F3–F16"'>
                  <input className={inputClasses} value={zone.floors} onChange={(e) => updateZone(zone._key, { floors: e.target.value })} />
                </Field>
                <Field label="Min / sq ft">
                  <input
                    className={inputClasses}
                    inputMode="decimal"
                    value={zone.minPerSqFt}
                    onChange={(e) => updateZone(zone._key, { minPerSqFt: e.target.value })}
                  />
                </Field>
                <Field label="Max / sq ft">
                  <input
                    className={inputClasses}
                    inputMode="decimal"
                    value={zone.maxPerSqFt}
                    onChange={(e) => updateZone(zone._key, { maxPerSqFt: e.target.value })}
                  />
                </Field>
              </div>
            </RepeatableCard>
          ))}
          <AddCardButton label="+ Add Zone" onClick={addZone} />
        </div>
      </div>
    </div>
  );
}
