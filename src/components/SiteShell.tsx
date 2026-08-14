import Footer from "./Footer";
import Navbar from "./Navbar";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-bg">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
}
