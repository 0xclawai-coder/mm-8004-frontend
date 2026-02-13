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

/** Get subtle background tint based on first category (Pokemon-type style) */
function getCategoryTint(categories: string[] | null | undefined): {
  bg: string;
  borderAccent: string;
} {
  const cat = categories?.[0]?.toLowerCase();
  if (!cat) return { bg: "from-slate-500/5 to-slate-600/5", borderAccent: "" };
  if (cat.includes("ai") || cat.includes("intelligence"))
    return { bg: "from-blue-500/8 to-blue-600/5", borderAccent: "shadow-blue-500/20" };
  if (cat.includes("defi") || cat.includes("finance"))
    return { bg: "from-emerald-500/8 to-emerald-600/5", borderAccent: "shadow-emerald-500/20" };
  if (cat.includes("identity") || cat.includes("security"))
    return { bg: "from-purple-500/8 to-purple-600/5", borderAccent: "shadow-purple-500/20" };
  if (cat.includes("oracle") || cat.includes("data"))
    return { bg: "from-orange-500/8 to-orange-600/5", borderAccent: "shadow-orange-500/20" };
  return { bg: "from-slate-500/5 to-slate-600/5", borderAccent: "" };
}

// ============================================================
// Component
// ============================================================

export function HoloCard(props: HoloCardProps) {
  const { agent } = props;

  // Resolve fields: explicit props win over agent-derived values
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

  // Tags: explicit tags take priority, otherwise auto-derive from agent
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
  const categoryTint = useMemo(() => getCategoryTint(categories), [categories]);

  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setMousePos({ x, y });
    },
    []
  );

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setMousePos({ x: 0.5, y: 0.5 });
  }, []);

  // 3D tilt: ±10 degrees max
  const rotateX = isHovering
    ? Math.max(-10, Math.min(10, (mousePos.y - 0.5) * -20))
    : 0;
  const rotateY = isHovering
    ? Math.max(-10, Math.min(10, (mousePos.x - 0.5) * 20))
    : 0;

  // Holo effect angles
  const mouseXPct = mousePos.x * 100;
  const mouseYPct = mousePos.y * 100;
  const angle = mousePos.x * 360;

  return (
    <div
      className="flex w-full justify-center lg:justify-start"
      style={{ perspective: "800px" }}
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
          transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: isHovering
            ? "transform 0.1s ease-out"
            : "transform 0.5s ease-out",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* === Glow border effect === */}
        <div
          className={cn(
            "absolute -inset-[3px] rounded-xl transition-opacity duration-300",
            isHovering ? "opacity-100" : "opacity-0",
            isHighScore && "opacity-50"
          )}
          style={{
            background: isHighScore
              ? `radial-gradient(circle at ${mouseXPct}% ${mouseYPct}%, rgba(251,191,36,0.7), rgba(245,158,11,0.4), transparent 70%)`
              : `radial-gradient(circle at ${mouseXPct}% ${mouseYPct}%, rgba(139,92,246,0.6), rgba(99,102,241,0.3), transparent 70%)`,
            filter: "blur(2px)",
          }}
        />

        {/* === Card body === */}
        <div
          className={cn(
            "relative flex aspect-[5/7] flex-col overflow-hidden rounded-xl",
            "border-2",
            isHighScore
              ? "border-amber-500/50"
              : "border-border/50",
            `bg-gradient-to-b ${categoryTint.bg}`
          )}
          style={{
            backgroundColor: "hsl(var(--card))",
          }}
        >
          {/* ======= HOLO LAYER 1: Rainbow shimmer ======= */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-10 rounded-xl transition-opacity duration-300",
              isHovering ? "opacity-40" : "opacity-0"
            )}
            style={{
              background: `repeating-linear-gradient(
                ${angle}deg,
                rgba(255,0,0,0.1) 0%,
                rgba(255,127,0,0.1) 10%,
                rgba(255,255,0,0.1) 20%,
                rgba(0,255,0,0.1) 30%,
                rgba(0,127,255,0.1) 40%,
                rgba(127,0,255,0.1) 50%,
                rgba(255,0,127,0.1) 60%,
                rgba(255,0,0,0.1) 70%
              )`,
              mixBlendMode: "color-dodge",
            }}
          />

          {/* ======= HOLO LAYER 2: Sparkle/grain texture ======= */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-10 rounded-xl transition-opacity duration-300",
              isHovering ? "opacity-30" : "opacity-0"
            )}
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 1%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 1%),
                radial-gradient(circle at 40% 70%, rgba(255,255,255,0.1) 0%, transparent 1%),
                radial-gradient(circle at 65% 55%, rgba(255,255,255,0.14) 0%, transparent 1%),
                radial-gradient(circle at 10% 80%, rgba(255,255,255,0.08) 0%, transparent 1%),
                radial-gradient(circle at 90% 70%, rgba(255,255,255,0.11) 0%, transparent 1%)
              `,
              backgroundSize: "50px 50px, 60px 60px, 45px 45px, 55px 55px, 40px 40px, 65px 65px",
              mixBlendMode: "overlay",
            }}
          />

          {/* ======= HOLO LAYER 3: Light reflection spot ======= */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-10 rounded-xl transition-opacity duration-300",
              isHovering ? "opacity-60" : "opacity-0"
            )}
            style={{
              background: `radial-gradient(
                circle at ${mouseXPct}% ${mouseYPct}%,
                rgba(255,255,255,0.3) 0%,
                rgba(255,255,255,0.1) 20%,
                transparent 50%
              )`,
              mixBlendMode: "overlay",
            }}
          />

          {/* ======= HOLO LAYER 4: Conic iridescence ======= */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-10 rounded-xl transition-opacity duration-300",
              isHovering ? "opacity-20" : "opacity-0"
            )}
            style={{
              background: `conic-gradient(
                from ${angle}deg at ${mouseXPct}% ${mouseYPct}%,
                oklch(0.75 0.2 0) 0deg,
                oklch(0.75 0.2 60) 60deg,
                oklch(0.75 0.2 120) 120deg,
                oklch(0.75 0.2 180) 180deg,
                oklch(0.75 0.2 240) 240deg,
                oklch(0.75 0.2 300) 300deg,
                oklch(0.75 0.2 360) 360deg
              )`,
              mixBlendMode: "color-dodge",
            }}
          />

          {/* ==========================================
              CARD LAYOUT — Pokemon Style
          ========================================== */}

          {/* 1. HEADER BAR — Name + Score */}
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

          {/* 2. IMAGE FRAME — ~50% of card */}
          <div className="relative z-20 mx-3 mt-0.5 flex-1 max-h-[52%] overflow-hidden rounded-md border-2 border-border/30">
            {/* Inner glow on hover */}
            <div
              className={cn(
                "pointer-events-none absolute inset-0 z-10 rounded-md transition-opacity duration-300",
                isHovering ? "opacity-100" : "opacity-0"
              )}
              style={{
                boxShadow:
                  "inset 0 0 20px rgba(139,92,246,0.2), inset 0 0 40px rgba(99,102,241,0.1)",
              }}
            />
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

          {/* 3. INFO STRIP — Agent ID · Chain Name */}
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
            {/* Description (1-2 lines) */}
            {description ? (
              <p className="line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            ) : name == null ? (
              <Skeleton className="h-5 w-full" />
            ) : null}

            {/* Feedback count */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">
                {feedbackCount} feedback{feedbackCount !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Category tags + derived tags */}
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
              {tags &&
                tags.map((tag) => (
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
