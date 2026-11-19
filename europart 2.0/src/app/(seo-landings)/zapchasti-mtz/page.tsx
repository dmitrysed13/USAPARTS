import { createLandingRoute } from "@/modules/seo/landing-route";

const route = createLandingRoute("zapchasti-mtz");

export const instant = false;
export const generateMetadata = route.generateMetadata;
export default route.Page;
