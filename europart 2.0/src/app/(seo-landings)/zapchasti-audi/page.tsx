import { createLandingRoute } from "@/modules/seo/landing-route";

const route = createLandingRoute("zapchasti-audi");

export const instant = false;
export const generateMetadata = route.generateMetadata;
export default route.Page;
