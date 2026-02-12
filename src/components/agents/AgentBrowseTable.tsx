"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { useAgents } from "@/hooks/useAgents";
import { SearchBar } from "@/components/agents/SearchBar";
import { ChainFilter } from "@/components/agents/ChainFilter";
import { CategoryFilter } from "@/components/agents/CategoryFilter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatAddress } from "@/lib/utils";
import TimeCounter from "@/components/ui/time-counter";
import type { SortOrder } from "@/types";

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

function getChainLabel(chainId: number): string {
  if (chainId === 143) return "Monad";
  if (chainId === 10143) return "Testnet";
  return `Chain ${chainId}`;
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border/30">
          {/* Name: Avatar + text */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <Skeleton className="h-4 w-28" />
            </div>
          </td>
          {/* Chain: Badge */}
          <td className="hidden px-4 py-3 sm:table-cell">
            <Skeleton className="h-5 w-16 rounded-full" />
          </td>
          {/* Score: Star icon + value */}
          <td className="px-4 py-3">
            <div className="flex items-center gap-1">
              <Skeleton className="size-3.5 rounded" />
              <Skeleton className="h-4 w-10" />
            </div>
          </td>
          {/* Feedback */}
          <td className="hidden px-4 py-3 md:table-cell">
            <Skeleton className="h-4 w-8" />
          </td>
          {/* Owner: mono address */}
          <td className="hidden px-4 py-3 lg:table-cell">
            <Skeleton className="h-3 w-24" />
          </td>
          {/* X402: Badge */}
          <td className="hidden px-4 py-3 lg:table-cell">
            <Skeleton className="h-5 w-10 rounded-full" />
          </td>
          {/* Created */}
          <td className="hidden px-4 py-3 xl:table-cell">
            <Skeleton className="h-3 w-14" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function AgentBrowseTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<SortOrder>("recent");
  const [search, setSearch] = useState("");
  const [chainId, setChainId] = useState<number | undefined>(143);
  const [category, setCategory] = useState("");

  const { data, isLoading } = useAgents({
    sort,
    page,
    limit,
    search: search || undefined,
    chain_id: chainId,
    category: category || undefined,
  });

  const agents = data?.agents ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // Generate page numbers to show
  const pageNumbers: number[] = [];
  const maxVisible = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold text-foreground">
        Agent Registry
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Browse and search all registered agents
      </p>

      {/* Search + Sort */}
      <div className="mb-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            className="w-full sm:max-w-xs"
          />
          <Select value={sort} onValueChange={(v) => { setSort(v as SortOrder); setPage(1); }}>
            <SelectTrigger size="sm" className="w-auto gap-1.5 border-border/50 bg-card/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Newest</SelectItem>
              <SelectItem value="score">Top Score</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <ChainFilter
            selected={chainId}
            onSelect={(v) => {
              setChainId(v);
              setPage(1);
            }}
            className="w-max"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <CategoryFilter
          selected={category}
          onSelect={(v) => {
            setCategory(v);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/50 bg-card/40">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Name</th>
              <th className="hidden px-4 py-3 sm:table-cell">Chain</th>
              <th className="px-4 py-3">Score</th>
              <th className="hidden px-4 py-3 md:table-cell">Feedback</th>
              <th className="hidden px-4 py-3 lg:table-cell">Owner</th>
              <th className="hidden px-4 py-3 lg:table-cell">X402</th>
              <th className="hidden px-4 py-3 xl:table-cell">Created</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableSkeleton rows={limit} />
            ) : agents.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={Users}
                    title="No Agents Found"
                    description="No agents match your current search or filter criteria."
                  />
                </td>
              </tr>
            ) : (
              agents.map((agent) => {
                const agentPath = `/explore/agents/${agent.chain_id}-${agent.agent_id}`;
                return (
                  <tr
                    key={`${agent.chain_id}-${agent.agent_id}`}
                    className="group cursor-pointer border-b border-border/30 transition-colors hover:bg-accent/50"
                    onClick={() => router.push(agentPath)}
                  >
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-3"
                      >
                        <Avatar className="size-8 shrink-0 ring-1 ring-border">
                          <AvatarImage
                            src={agent.image ?? undefined}
                            alt={agent.name ?? undefined}
                          />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                            {agent.name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate text-sm font-medium text-foreground">
                          {agent.name || `Agent #${agent.agent_id}`}
                        </span>
                      </div>
                    </td>

                    {/* Chain */}
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          agent.chain_id === 143
                            ? "border-green-500/30 bg-green-500/10 text-green-400"
                            : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
                        )}
                      >
                        {getChainLabel(agent.chain_id)}
                      </Badge>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star
                          className={cn(
                            "size-3.5",
                            getScoreColor(agent.reputation_score ?? 0),
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            getScoreColor(agent.reputation_score ?? 0),
                          )}
                        >
                          {(agent.reputation_score ?? 0).toFixed(1)}
                        </span>
                      </div>
                    </td>

                    {/* Feedback */}
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {agent.feedback_count}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <span className="text-xs font-mono text-muted-foreground">
                        {formatAddress(agent.owner)}
                      </span>
                    </td>

                    {/* X402 */}
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {agent.x402_support ? (
                        <Badge
                          variant="outline"
                          className="border-cyan-accent/30 bg-cyan-accent/10 text-cyan-accent text-[10px] px-1.5"
                        >
                          x402
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>

                    {/* Created */}
                    <td className="hidden px-4 py-3 xl:table-cell">
                      <span className="text-xs text-muted-foreground">
                        <TimeCounter targetTime={new Date(agent.block_timestamp)} />
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — always rendered to prevent layout shift */}
      <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-4 w-40" />
          ) : total > 0 ? (
            <span>
              Showing {start}-{end} of {total} agents
            </span>
          ) : (
            <span>&nbsp;</span>
          )}
          <div className="flex items-center gap-1.5">
            <span>Per page:</span>
            <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
              <SelectTrigger size="sm" className="w-auto gap-1 border-border/50 bg-card/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
            className="flex items-center gap-1 rounded-lg border border-border/50 bg-card/80 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-4" />
            Previous
          </button>
          {isLoading && pageNumbers.length === 0 ? (
            <div className="flex items-center gap-1">
              <Skeleton className="size-8 rounded-lg" />
            </div>
          ) : (
            pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                disabled={isLoading}
                className={cn(
                  "size-8 rounded-lg text-sm font-medium transition-colors",
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/50 bg-card/80 text-foreground hover:bg-accent/50",
                  isLoading && "opacity-60",
                )}
              >
                {p}
              </button>
            ))
          )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="flex items-center gap-1 rounded-lg border border-border/50 bg-card/80 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
