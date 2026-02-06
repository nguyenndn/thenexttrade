"use client";

import dynamic from "next/dynamic";

export const DynamicFirefly = dynamic(
    () => import("./FireflyBackground").then((mod) => mod.FireflyBackground),
    { ssr: false }
);
