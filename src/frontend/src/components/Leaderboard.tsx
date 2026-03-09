import type { ScoreEntry } from "../backend.d";
import { useLeaderboard } from "../hooks/useLeaderboard";

interface LeaderboardProps {
  className?: string;
  compact?: boolean;
}

function formatScore(score: bigint): string {
  return Number(score).toLocaleString();
}

function formatRank(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export function Leaderboard({
  className = "",
  compact = false,
}: LeaderboardProps) {
  const { data: scores, isLoading, isError } = useLeaderboard();

  const placeholderScores: ScoreEntry[] = [
    {
      id: BigInt(1),
      playerName: "WolfKing",
      score: BigInt(9850),
      timestamp: BigInt(0),
    },
    {
      id: BigInt(2),
      playerName: "ZombieSlayer",
      score: BigInt(7200),
      timestamp: BigInt(0),
    },
    {
      id: BigInt(3),
      playerName: "SteakHunter",
      score: BigInt(5600),
      timestamp: BigInt(0),
    },
    {
      id: BigInt(4),
      playerName: "Creeper404",
      score: BigInt(4100),
      timestamp: BigInt(0),
    },
    {
      id: BigInt(5),
      playerName: "DiamondWolf",
      score: BigInt(3200),
      timestamp: BigInt(0),
    },
  ];

  const displayScores: ScoreEntry[] =
    scores && scores.length > 0 ? scores.slice(0, 10) : placeholderScores;

  return (
    <div
      className={`mc-inventory ${className}`}
      data-ocid="splash.leaderboard.table"
      style={{
        padding: compact ? "14px" : "18px",
        minWidth: compact ? "280px" : "320px",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid rgba(100,160,50,0.15)",
          paddingBottom: "10px",
          marginBottom: "12px",
        }}
      >
        <h3
          className="gold-text"
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: compact ? "0.9rem" : "1rem",
            fontWeight: 800,
            letterSpacing: "0.07em",
            margin: 0,
            textAlign: "center",
          }}
        >
          ⚔ TOP HUNTERS ⚔
        </h3>
      </div>

      {/* Column Headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "44px 1fr 80px",
          gap: "4px",
          padding: "5px 8px",
          marginBottom: "6px",
          background: "rgba(255,255,255,0.03)",
          borderRadius: "6px",
        }}
      >
        {["RANK", "NAME", "SCORE"].map((h) => (
          <span
            key={h}
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#666",
              letterSpacing: "0.08em",
              textAlign: h === "SCORE" ? "right" : "left",
            }}
          >
            {h}
          </span>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div
          data-ocid="splash.leaderboard.loading_state"
          style={{
            textAlign: "center",
            padding: "22px",
            fontFamily: "'Outfit', sans-serif",
            fontSize: "0.78rem",
            color: "#777",
          }}
        >
          Loading scores...
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div
          data-ocid="splash.leaderboard.error_state"
          style={{
            textAlign: "center",
            padding: "14px",
            fontFamily: "'Outfit', sans-serif",
            fontSize: "0.72rem",
            color: "#c04a2a",
          }}
        >
          Failed to load scores
        </div>
      )}

      {/* Score rows */}
      {!isLoading &&
        displayScores.map((entry, index) => {
          const rank = index + 1;
          const isTopThree = rank <= 3;
          const ocid = `splash.leaderboard.row.${rank}` as const;

          return (
            <div
              key={entry.id.toString()}
              data-ocid={ocid}
              style={{
                display: "grid",
                gridTemplateColumns: "44px 1fr 80px",
                gap: "4px",
                padding: "6px 8px",
                background: isTopThree
                  ? "rgba(240,192,48,0.05)"
                  : index % 2 === 0
                    ? "rgba(255,255,255,0.018)"
                    : "transparent",
                borderRadius: "6px",
                marginBottom: "2px",
                transition: "background 0.15s",
              }}
            >
              {/* Rank */}
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.78rem",
                  fontWeight: isTopThree ? 700 : 400,
                  color:
                    rank === 1
                      ? "#f0c030"
                      : rank === 2
                        ? "#c8c8c8"
                        : rank === 3
                          ? "#c87040"
                          : "#555",
                }}
              >
                {formatRank(rank)}
              </span>

              {/* Name */}
              <span
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.78rem",
                  fontWeight: isTopThree ? 700 : 400,
                  color: isTopThree ? "#e8e8e8" : "#999",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {entry.playerName}
              </span>

              {/* Score — keep mono for number alignment */}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.72rem",
                  fontWeight: isTopThree ? 700 : 400,
                  color: isTopThree ? "#f0c030" : "#888",
                  textAlign: "right",
                }}
              >
                {formatScore(entry.score)}
              </span>
            </div>
          );
        })}

      {/* Empty state */}
      {!isLoading && !isError && displayScores.length === 0 && (
        <div
          data-ocid="splash.leaderboard.empty_state"
          style={{
            textAlign: "center",
            padding: "22px",
            fontFamily: "'Outfit', sans-serif",
            fontSize: "0.78rem",
            color: "#555",
          }}
        >
          No scores yet. Be the first!
        </div>
      )}

      {/* Footer note */}
      <div
        style={{
          marginTop: "10px",
          paddingTop: "8px",
          borderTop: "1px solid rgba(100,160,50,0.1)",
          fontFamily: "'Outfit', sans-serif",
          fontSize: "0.68rem",
          color: "#444",
          textAlign: "center",
        }}
      >
        {isLoading
          ? "Fetching from ICP..."
          : `${displayScores.length} hunters ranked`}
      </div>
    </div>
  );
}
