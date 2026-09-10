import { SectionCard } from "../shared";

// There is no website-traffic data source anywhere in this project — no
// GA4/Google Analytics, no Search Console, no pageview/session logging
// table, no analytics SDK of any kind (confirmed by a full-repo audit).
// Showing invented visitor/pageview numbers here would be worse than
// showing nothing, so this tells the admin exactly what's missing and what
// connecting it would take, instead of fabricating a chart.
export default function WebsitePerformanceSection() {
  return (
    <div className="space-y-5">
      <SectionCard title="Website Performance" subtitle="Not connected yet — this needs a website analytics integration.">
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line px-6 py-14 text-center">
          <p className="max-w-md text-sm font-medium text-ink">
            Sellam does not currently track website visitors, page views, or traffic sources.
          </p>
          <p className="max-w-md text-sm text-ink-soft">
            There is no Google Analytics (GA4), Search Console, or pageview-logging integration set up for this site. Connecting one of these — most commonly GA4, read via its Data API — would let this tab show real visitors, page views, most-viewed
            properties, and traffic sources instead of this placeholder.
          </p>
          <p className="max-w-md text-xs text-ink-soft">
            Enquiry volume, sources and conversion — the metrics Sellam's own database can already answer — are covered in the Enquiries, Funnel and Leads & Clients tabs.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
