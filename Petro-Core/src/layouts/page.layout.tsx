import SiteNavbar from "../components/site-navbar"
import { Outlet } from "react-router-dom"
import { LockdownBanner } from "@/components/lockdown-banner"

export const PageLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar />
      <LockdownBanner />
      <main className="max-w-6xl mx-auto px-4 pt-28 pb-16">
        <Outlet />
      </main>
    </div>
  )
}

export default PageLayout
