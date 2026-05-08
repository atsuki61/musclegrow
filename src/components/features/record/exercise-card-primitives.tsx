"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Activity,
  CircleDot,
  Dumbbell,
  Footprints,
  MoreHorizontal,
  Shield,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveExerciseIllustration } from "@/lib/exercise-illustrations";
import type { BodyPart, Exercise } from "@/types/workout";

const PART_ICONS: Record<Exclude<BodyPart, "all">, LucideIcon> = {
  chest: Dumbbell,
  back: UserRound,
  legs: Footprints,
  shoulders: Shield,
  arms: Activity,
  core: CircleDot,
  other: MoreHorizontal,
};

const PART_COLOR_VARS: Record<Exclude<BodyPart, "all">, string> = {
  chest: "var(--color-chest)",
  back: "var(--color-back)",
  legs: "var(--color-legs)",
  shoulders: "var(--color-shoulders)",
  arms: "var(--color-arms)",
  core: "var(--color-core)",
  other: "var(--color-other)",
};

function getInitialExerciseNameFontSize(name: string): number {
  const length = name.normalize("NFKC").replace(/\s+/g, "").length;

  if (length <= 6) return 15.5;
  if (length <= 8) return 14;
  if (length <= 10) return 11;
  if (length <= 12) return 8.5;
  if (length <= 14) return 7;
  return 6;
}

export function ExerciseFallbackVisual({
  bodyPart,
  label,
}: {
  bodyPart: Exclude<BodyPart, "all">;
  label: string;
}) {
  const Icon = PART_ICONS[bodyPart] ?? MoreHorizontal;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div
        className="flex aspect-square w-[68%] max-w-20 flex-col items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        style={{
          backgroundColor: `color-mix(in srgb, ${PART_COLOR_VARS[bodyPart]} 14%, transparent)`,
          borderColor: `color-mix(in srgb, ${PART_COLOR_VARS[bodyPart]} 30%, transparent)`,
          color: PART_COLOR_VARS[bodyPart],
        }}
      >
        <Icon className="size-6 stroke-[2.4]" aria-hidden="true" />
        <span className="mt-1 max-w-full px-1 text-[9px] font-black leading-none">
          {label}
        </span>
      </div>
    </div>
  );
}

export function ExerciseIllustrationVisual({
  exercise,
  fallbackLabel,
  className,
  imageClassName,
}: {
  exercise: Exercise;
  fallbackLabel: string;
  className?: string;
  imageClassName?: string;
}) {
  const illustration = resolveExerciseIllustration({
    name: exercise.name,
    bodyPart: exercise.bodyPart,
    equipmentType: exercise.primaryEquipment,
    muscleSubGroup: exercise.muscleSubGroup,
  });

  if (!illustration.src) {
    return (
      <ExerciseFallbackVisual
        bodyPart={exercise.bodyPart}
        label={fallbackLabel}
      />
    );
  }

  return (
    <div
      className={cn(
        "h-full w-full transition-transform duration-200 group-hover:scale-[1.04]",
        className
      )}
      style={{
        transform: `translate(${illustration.fit.x}px, ${illustration.fit.y}px) scale(${illustration.fit.scale})`,
      }}
    >
      <Image
        src={illustration.src}
        alt={illustration.alt}
        width={176}
        height={176}
        className={cn(
          "h-full w-full object-contain object-center",
          imageClassName
        )}
      />
    </div>
  );
}

export function ExerciseName({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(() =>
    getInitialExerciseNameFontSize(name)
  );
  const [scaleX, setScaleX] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const fitName = () => {
      const initialFontSize = getInitialExerciseNameFontSize(name);
      text.style.fontSize = `${initialFontSize}px`;
      text.style.transform = "scaleX(1)";

      const availableWidth = container.clientWidth;
      const neededWidth = text.scrollWidth;

      if (!availableWidth || !neededWidth || neededWidth <= availableWidth) {
        setFontSize(initialFontSize);
        setScaleX(1);
        return;
      }

      const fittedFontSize = Math.max(
        4.6,
        Math.floor((initialFontSize * availableWidth * 10) / neededWidth) / 10
      );
      setFontSize(fittedFontSize);

      window.requestAnimationFrame(() => {
        if (!text || !container) return;
        const nextNeededWidth = text.scrollWidth;
        const nextAvailableWidth = container.clientWidth;
        setScaleX(
          nextNeededWidth > nextAvailableWidth
            ? Math.max(0.58, nextAvailableWidth / nextNeededWidth)
            : 1
        );
      });
    };

    fitName();

    const ResizeObserverCtor = globalThis.ResizeObserver;
    const resizeObserver = ResizeObserverCtor
      ? new ResizeObserverCtor(fitName)
      : undefined;

    resizeObserver?.observe(container);
    window.addEventListener("resize", fitName);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", fitName);
    };
  }, [name]);

  return (
    <span
      ref={containerRef}
      className={cn(
        "mt-auto block w-full min-w-0 overflow-hidden text-center leading-none",
        className
      )}
    >
      <span
        ref={textRef}
        className="inline-block max-w-none whitespace-nowrap font-black leading-none text-foreground transition-colors group-hover:text-primary"
        style={{
          fontSize: `${fontSize}px`,
          transform: `scaleX(${scaleX})`,
          transformOrigin: "center",
        }}
      >
        {name}
      </span>
    </span>
  );
}
