"use client";

import dynamic from "next/dynamic";

const CreateLevelModal = dynamic(() => import("./CreateLevelModal"), {
    ssr: false
});

export default function DynamicCreateLevelModal() {
    return <CreateLevelModal />;
}
