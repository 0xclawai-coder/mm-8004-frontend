"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Star, Shield, Zap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getChainLabel } from "@/lib/chain-utils";
import type { AgentDetail } from "@/types";

// ============================================================
// Public Props
// ============================================================

export interface HoloCardProps {
  /** Pass a full AgentDetail and the card auto-derives everything. */
  agent?: AgentDetail;

  // --- OR supply individual fields (override agent fields when both given) ---
  image?: string | null;
  name?: string;
  description?: string | null;
  score?: number | null;
  feedbackCount?: number;
  chainId?: number;
  owner?: string;
  tags?: { label: string; icon: React.ReactNode; className: string }[];
}

// ============================================================
// Internal helpers
// ============================================================

function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isNewbie(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays =
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

/** Clamp value between min and max */
function clamp(val: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, val));
}

/** Map value from one range to another */
function adjust(
  val: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number {
  return toMin + ((val - fromMin) / (fromMax - fromMin)) * (toMax - toMin);
}

/** Get glow color based on first category (like Pokemon type → card glow) */
function getCategoryGlow(
  categories: string[] | null | undefined
): { glow: string; tint: string } {
  const cat = categories?.[0]?.toLowerCase();
  if (!cat) return { glow: "hsl(187, 85%, 60%)", tint: "" };
  if (cat.includes("ai") || cat.includes("intelligence"))
    return { glow: "hsl(210, 100%, 65%)", tint: "from-blue-500/6 to-transparent" };
  if (cat.includes("defi") || cat.includes("finance"))
    return { glow: "hsl(150, 80%, 55%)", tint: "from-emerald-500/6 to-transparent" };
  if (cat.includes("identity") || cat.includes("security"))
    return { glow: "hsl(280, 70%, 60%)", tint: "from-purple-500/6 to-transparent" };
  if (cat.includes("oracle") || cat.includes("data"))
    return { glow: "hsl(30, 90%, 60%)", tint: "from-orange-500/6 to-transparent" };
  return { glow: "hsl(187, 85%, 60%)", tint: "" };
}

// ============================================================
// Component
// ============================================================

export function HoloCard(props: HoloCardProps) {
  const { agent } = props;

  // Resolve fields
  const image = props.image !== undefined ? props.image : agent?.image ?? null;
  const name =
    props.name ?? agent?.name ?? (agent ? `Agent #${agent.agent_id}` : undefined);
  const description =
    props.description !== undefined
      ? props.description
      : agent?.description ?? null;
  const rawScore =
    props.score !== undefined ? props.score : agent?.reputation_score ?? null;
  const score = rawScore ?? (props.name != null || agent != null ? 0 : null);
  const feedbackCount = props.feedbackCount ?? agent?.feedback_count ?? 0;
  const chainId = props.chainId ?? agent?.chain_id;
  const owner = props.owner ?? agent?.owner;
  const categories = agent?.categories;
  const agentId = agent?.agent_id;

  // Tags
  let tags = props.tags;
  if (!tags && agent) {
    tags = [];
    if (isNewbie(agent.block_timestamp)) {
      tags.push({
        label: "Newbie",
        icon: <Sparkles className="size-3" />,
        className: "border-green-400/40 bg-green-400/10 text-green-400",
      });
    }
    if (agent.x402_support) {
      tags.push({
        label: "X402",
        icon: <Shield className="size-3" />,
        className: "border-cyan-400/40 bg-cyan-400/10 text-cyan-400",
      });
    }
    if ((agent.reputation_score ?? 0) >= 90) {
      tags.push({
        label: "High Score",
        icon: <Zap className="size-3" />,
        className: "border-yellow-400/40 bg-yellow-400/10 text-yellow-400",
      });
    }
  }

  const isHighScore = (score ?? 0) > 80;
  const categoryStyle = useMemo(() => getCategoryGlow(categories), [categories]);

  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const absX = e.clientX - rect.left;
      const absY = e.clientY - rect.top;
      const pctX = clamp((absX / rect.width) * 100);
      const pctY = clamp((absY / rect.height) * 100);
      setMousePos({ x: pctX, y: pctY });
      setBgPos({
        x: adjust(pctX, 0, 100, 37, 63),
        y: adjust(pctY, 0, 100, 33, 67),
      });
    },
    []
  );

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setMousePos({ x: 50, y: 50 });
    setBgPos({ x: 50, y: 50 });
  }, []);

  // 3D tilt (±10 degrees), matching pokemon-cards-css: rotateY(-(centerX/3.5)) rotateX(centerY/3.5)
  const centerX = mousePos.x - 50;
  const centerY = mousePos.y - 50;
  const rotateX = isHovering ? clamp(centerY / 10, -5, 5) : 0;
  const rotateY = isHovering ? clamp(-centerX / 10, -5, 5) : 0;

  // Pointer distance from center (0..1) — used for brightness/opacity
  const pointerFromCenter = isHovering
    ? clamp(Math.sqrt(centerX * centerX + centerY * centerY) / 50, 0, 1)
    : 0;
  const pointerFromTop = mousePos.y / 100;
  const pointerFromLeft = mousePos.x / 100;

  const cardOpacity = isHovering ? 1 : 0;

  // Sunpillar rainbow colors (from pokemon-cards-css)
  const sunpillars = {
    1: "hsl(2, 100%, 73%)",
    2: "hsl(53, 100%, 69%)",
    3: "hsl(93, 100%, 69%)",
    4: "hsl(176, 100%, 76%)",
    5: "hsl(228, 100%, 74%)",
    6: "hsl(283, 100%, 73%)",
  };

  return (
    <div
      className="flex w-full justify-center lg:justify-start"
      style={{ perspective: "600px" }}
    >
      <div
        ref={cardRef}
        className={cn(
          "relative w-full max-w-[300px]",
          "cursor-pointer select-none",
          "motion-safe:will-change-transform"
        )}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
          transition: isHovering
            ? "transform 0.1s ease-out"
            : "transform 0.5s ease-out",
          // Subtle glow on hover
          boxShadow: isHovering
            ? `0 0 8px 1px ${categoryStyle.glow}40,
               0px 8px 16px -4px rgba(0,0,0,0.4)`
            : `0px 4px 12px -4px rgba(0,0,0,0.25)`,
          borderRadius: "4.55% / 3.5%",
          transitionProperty: isHovering
            ? "transform"
            : "transform, box-shadow",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* === Card body === */}
        <div
          className={cn(
            "relative flex aspect-[5/7] flex-col overflow-hidden",
            "border-2",
            isHighScore ? "border-amber-400/60" : "border-border/40",
            categoryStyle.tint && `bg-gradient-to-b ${categoryStyle.tint}`
          )}
          style={{
            backgroundColor: "hsl(var(--card))",
            borderRadius: "4.55% / 3.5%",
            outline: "1px solid transparent", // anti-alias trick from pokemon-cards-css
          }}
        >
          {/* ======================================================
              SHINE — Subtle rainbow shimmer (toned down)
          ====================================================== */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              borderRadius: "inherit",
              backgroundImage: `
                repeating-linear-gradient(
                  133deg,
                  ${sunpillars[1]}, ${sunpillars[2]}, ${sunpillars[3]},
                  ${sunpillars[4]}, ${sunpillars[5]}, ${sunpillars[6]},
                  ${sunpillars[1]}
                )
              `,
              backgroundPosition: `calc(((50% - ${bgPos.x}%) * 1.5) + 50%) calc(((50% - ${bgPos.y}%) * 2) + 50%)`,
              backgroundSize: "300% 300%",
              filter: "brightness(0.9) saturate(0.8)",
              mixBlendMode: "color-dodge",
              opacity: cardOpacity * 0.35,
              transition: "opacity 0.4s ease",
            }}
          />

          {/* ======================================================
              GLARE — Soft light spot following mouse
          ====================================================== */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              borderRadius: "inherit",
              backgroundImage: `
                radial-gradient(
                  farthest-corner circle at ${mousePos.x}% ${mousePos.y}%,
                  hsla(0, 0%, 100%, 0.25) 0%,
                  hsla(0, 0%, 100%, 0.1) 30%,
                  transparent 70%
                )
              `,
              mixBlendMode: "overlay",
              opacity: cardOpacity * 0.6,
              transition: "opacity 0.4s ease",
            }}
          />

          {/* ==========================================
              CARD CONTENT — Pokemon Style Layout
          ========================================== */}

          {/* 1. HEADER BAR — Name (left) + Score/HP (right) */}
          <div className="relative z-20 flex items-center justify-between px-3 pt-2.5 pb-1">
            {name != null ? (
              <h3 className="truncate text-sm font-bold text-foreground leading-tight">
                {name}
              </h3>
            ) : (
              <Skeleton className="h-4 w-24" />
            )}
            {score != null ? (
              <div className="flex shrink-0 items-center gap-1 ml-2">
                <Star className="size-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-bold tabular-nums text-yellow-400">
                  {Math.round(score)}
                </span>
              </div>
            ) : (
              <Skeleton className="h-4 w-12" />
            )}
          </div>

          {/* 2. IMAGE FRAME — ~50% of card with inner border */}
          <div
            className="relative z-20 mx-3 mt-0.5 flex-1 max-h-[52%] overflow-hidden"
            style={{
              borderRadius: "3%",
              border: "2px solid hsla(0, 0%, 100%, 0.1)",
              boxShadow: isHovering
                ? `inset 0 0 20px 2px ${categoryStyle.glow}33`
                : "none",
              transition: "box-shadow 0.3s ease",
            }}
          >
            {image ? (
              <Image
                src={image}
                alt={name ?? "Agent"}
                fill
                className="object-cover"
                sizes="300px"
              />
            ) : name != null ? (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-violet-500/20 to-cyan-500/15">
                <span className="text-5xl font-bold text-primary/40">
                  {name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            ) : (
              <Skeleton className="h-full w-full rounded-none" />
            )}
          </div>

          {/* 3. INFO STRIP — Agent #ID · Chain */}
          <div className="relative z-20 flex items-center justify-center gap-1.5 px-3 pt-1.5">
            {agentId != null && chainId != null ? (
              <span className="text-[10px] text-muted-foreground leading-none">
                Agent #{agentId} · {getChainLabel(chainId)}
              </span>
            ) : chainId != null ? (
              <span className="text-[10px] text-muted-foreground leading-none">
                {getChainLabel(chainId)}
              </span>
            ) : name != null ? (
              <span className="text-[10px] text-muted-foreground leading-none">
                &nbsp;
              </span>
            ) : (
              <Skeleton className="h-3 w-24" />
            )}
          </div>

          {/* 4. STATS / DESCRIPTION AREA */}
          <div className="relative z-20 flex flex-col gap-1.5 px-3 pt-1.5">
            {/* Description */}
            {description ? (
              <p className="line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : name == null ? (
              <Skeleton className="h-5 w-full" />
            ) : null}

            {/* Feedback */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">
                {feedbackCount} feedback{feedbackCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Category + derived tags */}
            <div className="flex flex-wrap gap-1">
              {categories?.map((cat) => (
                <Badge
                  key={cat}
                  variant="outline"
                  className="px-1.5 py-0 text-[9px] leading-4 border-border/40 bg-muted/30 text-muted-foreground"
                >
                  {cat}
                </Badge>
              ))}
              {tags?.map((tag) => (
                <Badge
                  key={tag.label}
                  variant="outline"
                  className={cn(
                    "gap-0.5 px-1.5 py-0 text-[9px] leading-4",
                    tag.className
                  )}
                >
                  {tag.icon}
                  {tag.label}
                </Badge>
              ))}
              {!categories?.length && !tags?.length && name == null && (
                <>
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </>
              )}
            </div>
          </div>

          {/* 5. FOOTER — Owner + Chain Badge */}
          <div className="relative z-20 mt-auto flex items-center justify-between px-3 pb-2.5 pt-1">
            {owner ? (
              <span className="text-[9px] font-mono text-muted-foreground/70 leading-none">
                {truncateAddress(owner)}
              </span>
            ) : name != null ? (
              <span />
            ) : (
              <Skeleton className="h-3 w-20" />
            )}
            {chainId != null ? (
              <Badge
                variant="outline"
                className={cn(
                  "px-1.5 py-0 text-[9px] leading-4",
                  chainId === 143
                    ? "border-green-500/30 bg-green-500/10 text-green-400"
                    : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
                )}
              >
                {getChainLabel(chainId)}
              </Badge>
            ) : name == null ? (
              <Skeleton className="h-4 w-12 rounded-full" />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
