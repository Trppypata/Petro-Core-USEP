import SiteNavbar from "../components/site-navbar"
import { Outlet } from "react-router-dom"

export const PageLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar />
      <main className="max-w-6xl mx-auto px-4 py-24">
        <Outlet />
      </main>
    </div>
  )
}

export default PageLayout
