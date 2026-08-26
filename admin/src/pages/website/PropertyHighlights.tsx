import ComingSoonPage from "../../components/ComingSoonPage";
import { StarIcon } from "../../components/icons";

export default function PropertyHighlights() {
  return (
    <ComingSoonPage
      title="Property Highlights"
      subtitle="Featured & Exclusive Properties"
      icon={<StarIcon className="h-6 w-6" />}
      description="Curate which existing properties appear as Featured and Exclusive on the Sellam homepage. Properties themselves will still live entirely in the existing Properties table — this only controls which ones are highlighted."
      upcomingFeatures={[
        "Mark existing properties as Featured",
        "Mark existing properties as Exclusive",
        "Reorder highlighted properties",
        "Remove a property from a homepage section",
      ]}
    />
  );
}
