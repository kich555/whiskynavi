import Overview from "./_components/Overview";
import { loadOverview } from "./actions";
export default async function Page() {
  return <Overview result={await loadOverview("notices")} section="notices" />;
}
