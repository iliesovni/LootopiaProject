"use client";
import ARViewer from "@/components/ar/ARViewer";
import { useParams } from "next/navigation";

export default function PlayPage() {
  const { id }: { id: string } = useParams();
  return <ARViewer participationId={id} />;
}
