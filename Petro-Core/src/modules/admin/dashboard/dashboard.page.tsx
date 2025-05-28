import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/sr-tabs";
import { Link, Outlet, useLocation } from "react-router-dom";
import OverviewDashboard from "./overviewDashboard.page";
// import BookletDashboard from "./overview-dash";

const DashboardPage = () => {
  const location = useLocation();
  const currentTab = location.pathname.split("/").pop(); // Get current tab based on the route


  return (
    <Tabs defaultValue="overview">
      <div className="flex items-center">
        <TabsList>
          <Link to={'overview'}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </Link>
            
          <Link to={"detailed"}>
            <TabsTrigger value="detailed">Details</TabsTrigger>
          </Link>
        </TabsList>
      </div>

        <TabsContent value={currentTab as string === "dashboard-app" ? "overview" : currentTab as string}>
          {currentTab === 'dashboard-app' ? <OverviewDashboard /> : <Outlet />}

        </TabsContent>
    </Tabs>
  )
}

export default DashboardPage
