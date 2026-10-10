import DesktopStorefront from "./components/DesktopStorefront";
import MobileStorefront from "./components/MobileStorefront";

export default function Home() {
  return (
    <>
      <div className="md:hidden">
        <MobileStorefront />
      </div>
      <div className="hidden md:block">
        <DesktopStorefront />
      </div>
    </>
  );
}
