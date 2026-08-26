import ComingSoonPage from "../../components/ComingSoonPage";
import { LinkIcon, QuoteIcon } from "../../components/icons";

export default function Testimonials() {
  return (
    <ComingSoonPage
      title="Client Testimonials"
      subtitle="Collect Client Feedback"
      icon={<QuoteIcon className="h-6 w-6" />}
      description="Send clients a link to a public form where they can submit a testimonial. Submissions will land here for review before anything is published to the website."
      upcomingFeatures={[
        "Shareable public testimonial submission link",
        "Collect client name, email, property, and testimonial",
        "Optional client photo upload",
        "Client permission-to-publish confirmation",
        "Review and approve submissions before they go live",
      ]}
      extra={
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink-soft opacity-70"
        >
          <LinkIcon className="h-4 w-4" />
          Copy Testimonial Submission Link
        </button>
      }
    />
  );
}
