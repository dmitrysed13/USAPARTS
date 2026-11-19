import { createLandingRoute } from "@/modules/seo/landing-route";

const route = createLandingRoute("avtozapchasti");

export const instant = false;
export const generateMetadata = route.generateMetadata;
export default route.Page;
