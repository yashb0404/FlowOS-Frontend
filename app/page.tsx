import { Tabs } from "@/components/Tabs";

export default function Home() {
  return (
    <>
      <div className="app-bg" aria-hidden>
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="petal" />
        ))}
      </div>
      <Tabs />
    </>
  );
}
