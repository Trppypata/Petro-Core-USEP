import PageLayout from "@/layouts/page.layout";
import HeroSection from "@/modules/home/hero/hero";
import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    Component: PageLayout,
    children: [
      { 
        index: true,
        path: "/",
        Component: HeroSection,
      },
    ]
  }
]);

export default router;