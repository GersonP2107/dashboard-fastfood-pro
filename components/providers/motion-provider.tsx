"use client";

import { LazyMotion } from "framer-motion";

// Carga las animaciones de manera diferida, así los usuarios que no ven animaciones
// en su primera carga (o que prefieren reduced-motion) no descargan código extra.
const loadFeatures = () => import("framer-motion").then((res) => res.domAnimation);

export function MotionProvider({ children }: { children: React.ReactNode }) {
    return (
        <LazyMotion features={loadFeatures}>
            {children}
        </LazyMotion>
    );
}
