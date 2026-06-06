import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nöbetçi Admin — İhbar Yönetimi",
  description: "Gelen ihbarları inceleme ve durum güncelleme paneli",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0f172a_0%,#111827_38%,#1e293b_100%)] text-zinc-100">
      {children}
    </div>
  );
}
