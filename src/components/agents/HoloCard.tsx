"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Star, Shield, Zap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

import { getChainLabel } from '@/lib/chain-utils'

function truncateAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isNewbie(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

function StarRating({ score }: { score: number }) {
  const clamped = Math.min(5, Math.max(0, score));
  const fullStars = Math.floor(clamped);
  const partial = clamped - fullStars;
  const emptyStars = 5 - fullStars - (partial > 0 ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className="size-4 fill-yellow-400 text-yellow-400"
        />
      ))}
      {partial > 0 && (
        <div className="relative">
          <Star className="size-4 text-muted-foreground/30" />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${partial * 100}%` }}
          >
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className="size-4 text-muted-foreground/30" />
      ))}
    </div>
  );
}

// ============================================================
// Component
// ============================================================

export function HoloCard(props: HoloCardProps) {
  const { agent } = props;

  // Resolve fields: explicit props win over agent-derived values
  // Keep undefined when no data at all (for skeleton rendering)
  const image = props.image !== undefined ? props.image : agent?.image ?? null;
  const name = props.name ?? agent?.name ?? (agent ? `Agent #${agent.agent_id}` : undefined);
  const description = props.description !== undefined ? props.description : agent?.description ?? null;
  // Score: treat null/undefined as 0 once we have agent data (not loading)
  const rawScore = props.score !== undefined ? props.score : agent?.reputation_score ?? null;
  const score = rawScore ?? (props.name != null || agent != null ? 0 : null);
  const feedbackCount = props.feedbackCount ?? agent?.feedback_count ?? 0;
  const chainId = props.chainId ?? agent?.chain_id;
  const owner = props.owner ?? agent?.owner;

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
        label: "X402-Verified",
        icon: <Shield className="size-3" />,
        className: "border-cyan-accent/40 bg-cyan-accent/10 text-cyan-accent",
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

  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setMousePos({ x: 0.5, y: 0.5 });
  }, []);

  const rotateX = isHovering ? (mousePos.y - 0.5) * -30 : 0;
  const rotateY = isHovering ? (mousePos.x - 0.5) * 30 : 0;

  // Clamp rotation to +-15 degrees
  const clampedRotateX = Math.max(-15, Math.min(15, rotateX));
  const clampedRotateY = Math.max(-15, Math.min(15, rotateY));

  // Glow position for the border effect
  const glowX = mousePos.x * 100;
  const glowY = mousePos.y * 100;

  return (
    <div className="holo-perspective flex w-full justify-center lg:justify-start" style={{ perspective: "1000px" }}>
      <div
        ref={cardRef}
        className={cn(
          "holo-card relative w-full max-w-[300px] rounded-2xl",
          "cursor-pointer select-none",
          "motion-safe:will-change-transform",
        )}
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${clampedRotateX}deg) rotateY(${clampedRotateY}deg)`,
          transition: isHovering
            ? "transform 0.1s ease-out"
            : "transform 0.5s ease-out",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Glow border effect */}
        <div
          className={cn(
            "holo-card-glow absolute -inset-[2px] rounded-2xl opacity-0 transition-opacity duration-300",
            isHovering && "opacity-100",
          )}
          style={{
            background: `radial-gradient(circle at ${glowX}% ${glowY}%, oklch(0.70 0.25 285 / 0.6), oklch(0.78 0.15 195 / 0.3), transparent 70%)`,
          }}
        />

        {/* Card body */}
        <div className="relative flex aspect-[5/7] flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/95 backdrop-blur-sm">
          {/* Holographic shimmer overlay */}
          <div
            className={cn(
              "holo-card-shimmer pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-300",
              isHovering && "opacity-30",
            )}
            style={{
              background: `conic-gradient(
                from ${mousePos.x * 360}deg at ${mousePos.x * 100}% ${mousePos.y * 100}%,
                oklch(0.75 0.2 0) 0deg,
                oklch(0.75 0.2 30) 30deg,
                oklch(0.75 0.2 60) 60deg,
                oklch(0.75 0.2 90) 90deg,
                oklch(0.75 0.2 120) 120deg,
                oklch(0.75 0.2 150) 150deg,
                oklch(0.75 0.2 180) 180deg,
                oklch(0.75 0.2 210) 210deg,
                oklch(0.75 0.2 240) 240deg,
                oklch(0.75 0.2 270) 270deg,
                oklch(0.75 0.2 300) 300deg,
                oklch(0.75 0.2 330) 330deg,
                oklch(0.75 0.2 360) 360deg
              )`,
              mixBlendMode: "color-dodge",
            }}
          />

          {/* Secondary shimmer layer for depth */}
          <div
            className={cn(
              "holo-card-shimmer-secondary pointer-events-none absolute inset-0 z-10 rounded-2xl opacity-0 transition-opacity duration-300",
              isHovering && "opacity-20",
            )}
            style={{
              background: `linear-gradient(
                ${mousePos.x * 180 + 90}deg,
                transparent 20%,
                oklch(0.90 0.15 285 / 0.4) 45%,
                oklch(0.90 0.15 195 / 0.4) 55%,
                transparent 80%
              )`,
              mixBlendMode: "overlay",
            }}
          />

          {/* Image Section */}
          <div className="relative h-[55%] w-full shrink-0 overflow-hidden bg-gradient-to-b from-primary/20 to-transparent">
            {image ? (
              <Image
                src={image}
                alt={name ?? "Agent"}
                fill
                className="object-cover"
                sizes="300px"
              />
            ) : name != null ? (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/30 via-violet-dim/30 to-cyan-accent/20">
                <span className="text-6xl font-bold text-primary/40">
                  {name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
            ) : (
              <Skeleton className="h-full w-full rounded-none" />
            )}
            {/* Image gradient overlay for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
          </div>

          {/* Card Content — visual-only: score + star rating + tags */}
          <div className="relative z-20 flex flex-1 flex-col overflow-hidden p-5">
            <div className="space-y-3">
              {/* Reputation Score — prominent display */}
              <div className="flex items-center justify-between">
                {score != null ? (
                  <div className="flex items-center gap-2">
                    <Star
                      className={cn(
                        "size-5",
                        getScoreColor(score),
                      )}
                    />
                    <span
                      className={cn(
                        "text-2xl font-bold tabular-nums",
                        getScoreColor(score),
                      )}
                    >
                      {score.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / 100
                    </span>
                  </div>
                ) : (
                  <Skeleton className="h-7 w-24" />
                )}
                <span className="text-xs text-muted-foreground">
                  {feedbackCount} feedback{feedbackCount !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Star Rating visual */}
              {score != null && (
                <StarRating score={score / 20} />
              )}

              {/* Tags Row */}
              {tags && tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge
                      key={tag.label}
                      variant="outline"
                      className={cn("gap-1 text-xs px-2 py-0.5", tag.className)}
                    >
                      {tag.icon}
                      {tag.label}
                    </Badge>
                  ))}
                </div>
              ) : !agent && !props.tags ? (
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              ) : null}
            </div>

            {/* Bottom: Chain badge */}
            <div className="mt-auto flex items-center justify-center pt-3">
              {chainId != null ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs px-2",
                    chainId === 143
                      ? "border-green-500/30 bg-green-500/10 text-green-400"
                      : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
                  )}
                >
                  {getChainLabel(chainId)}
                </Badge>
              ) : (
                <Skeleton className="h-5 w-16 rounded-full" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
