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
import type { Agent, SortOrder } from "@/types";

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-yellow-400";
  return "text-red-400";
}

import { getChainLabel } from '@/lib/chain-utils'

function AgentTableRow({ agent, index }: { agent: Agent | null; index: number }) {
  const router = useRouter();
  const agentPath = agent ? `/explore/agents/${agent.chain_id}/${agent.agent_id}` : undefined;

  return (
    <tr
      className={cn(
        "border-b border-border/30",
        agent && "group cursor-pointer transition-colors hover:bg-accent/50"
      )}
      onClick={agentPath ? () => router.push(agentPath) : undefined}
      onMouseEnter={agentPath ? () => router.prefetch(agentPath) : undefined}
    >
      {/* Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {agent ? (
            <Avatar className="size-8 shrink-0 ring-1 ring-border">
              <AvatarImage src={agent.image ?? undefined} alt={agent.name ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {agent.name?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          ) : (
            <Skeleton className="size-8 shrink-0 rounded-full" />
          )}
          {agent ? (
            <span className="truncate text-sm font-medium text-foreground">
              {agent.name || `Agent #${agent.agent_id}`}
            </span>
          ) : (
            <Skeleton className="h-4 w-28" />
          )}
        </div>
      </td>

      {/* Chain */}
      <td className="hidden px-4 py-3 sm:table-cell">
        {agent ? (
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
        ) : (
          <Skeleton className="h-5 w-16 rounded-full" />
        )}
      </td>

      {/* Score */}
      <td className="px-4 py-3">
        {agent ? (
          <div className="flex items-center gap-1">
            <Star className={cn("size-3.5", getScoreColor(agent.reputation_score ?? 0))} />
            <span className={cn("text-sm font-semibold", getScoreColor(agent.reputation_score ?? 0))}>
              {(agent.reputation_score ?? 0).toFixed(1)}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <Skeleton className="size-3.5 rounded" />
            <Skeleton className="h-4 w-10" />
          </div>
        )}
      </td>

      {/* Feedback */}
      <td className="hidden px-4 py-3 md:table-cell">
        {agent ? (
          <span className="text-sm text-muted-foreground">{agent.feedback_count}</span>
        ) : (
          <Skeleton className="h-4 w-8" />
        )}
      </td>

      {/* Owner */}
      <td className="hidden px-4 py-3 lg:table-cell">
        {agent ? (
          <span className="text-xs font-mono text-muted-foreground">{formatAddress(agent.owner)}</span>
        ) : (
          <Skeleton className="h-3 w-20" />
        )}
      </td>

      {/* X402 */}
      <td className="hidden px-4 py-3 lg:table-cell">
        {agent ? (
          agent.x402_support ? (
            <Badge variant="outline" className="border-cyan-accent/30 bg-cyan-accent/10 text-cyan-accent text-[10px] px-1.5">
              x402
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">-</span>
          )
        ) : (
          <Skeleton className="h-5 w-10 rounded-full" />
        )}
      </td>

      {/* Created */}
      <td className="hidden px-4 py-3 xl:table-cell">
        {agent ? (
          <span className="text-xs text-muted-foreground">
            <TimeCounter targetTime={new Date(agent.block_timestamp)} />
          </span>
        ) : (
          <Skeleton className="h-3 w-16" />
        )}
      </td>
    </tr>
  );
}

export function AgentBrowseTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<SortOrder>("recent");
  const [search, setSearch] = useState("");
  const [chainId, setChainId] = useState<number | undefined>(undefined);
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
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-foreground">
        Entity Registry
      </h2>
      <p className="text-sm text-muted-foreground">
        Browse and search all incorporated entities
      </p>

      {/* Search + Sort */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            className="w-full sm:max-w-md"
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
      <div>
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
              Array.from({ length: limit }).map((_, i) => (
                <AgentTableRow key={i} agent={null} index={i} />
              ))
            ) : agents.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={Users}
                    title="No Entities Found"
                    description="No entities match your current search or filter criteria."
                  />
                </td>
              </tr>
            ) : (
              agents.map((agent, i) => (
                <AgentTableRow key={`${agent.chain_id}-${agent.agent_id}`} agent={agent} index={i} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — always rendered to prevent layout shift */}
      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {isLoading ? (
            <Skeleton className="h-4 w-40" />
          ) : total > 0 ? (
            <span>
              Showing {start}-{end} of {total} entities
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
