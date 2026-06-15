"use client";

import { swaggerSpec } from "@/lib/openapi/spec";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
    return (
        <main className="min-h-screen bg-[#FFFAF0]">
            <div className="mx-auto max-w-6xl px-4 py-6">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                    <SwaggerUI spec={ swaggerSpec }/>
                </div>
            </div>
        </main>
    );
}