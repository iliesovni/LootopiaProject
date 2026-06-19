"use client";
import ARViewer from "@/components/ar/ARViewer";
import { useParams } from "next/navigation";

export default function PlayPage() {
  const { id }: { id: string } = useParams();
  return (
    <div className="w-1/2 h-screen">
      <ARViewer huntId="66666666-6666-4666-8666-666666666666" />
    </div>
  );
}
