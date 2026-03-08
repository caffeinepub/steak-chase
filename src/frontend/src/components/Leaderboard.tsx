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
        padding: compact ? "12px" : "16px",
        minWidth: compact ? "280px" : "320px",
      }}
    >
      {/* Header */}
      <div
        style={{
          borderBottom: "2px solid #5a5a5a",
          paddingBottom: "8px",
          marginBottom: "10px",
        }}
      >
        <h3
          className="gold-text"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: compact ? "0.7rem" : "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
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
          gridTemplateColumns: "40px 1fr 80px",
          gap: "4px",
          padding: "4px 6px",
          marginBottom: "4px",
          background: "rgba(255,255,255,0.04)",
          borderBottom: "1px solid #3a3a3a",
        }}
      >
        {["RANK", "NAME", "SCORE"].map((h) => (
          <span
            key={h}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.55rem",
              color: "#888",
              fontWeight: 700,
              letterSpacing: "0.1em",
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
            padding: "20px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            color: "#888",
            letterSpacing: "0.05em",
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
            padding: "12px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
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
                gridTemplateColumns: "40px 1fr 80px",
                gap: "4px",
                padding: "5px 6px",
                background: isTopThree
                  ? "rgba(240,192,48,0.06)"
                  : index % 2 === 0
                    ? "rgba(255,255,255,0.02)"
                    : "transparent",
                borderBottom: "1px solid rgba(90,90,90,0.3)",
                transition: "background 0.15s",
              }}
            >
              {/* Rank */}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  color:
                    rank === 1
                      ? "#f0c030"
                      : rank === 2
                        ? "#c0c0c0"
                        : rank === 3
                          ? "#c87040"
                          : "#666",
                  fontWeight: isTopThree ? 700 : 400,
                }}
              >
                {formatRank(rank)}
              </span>

              {/* Name */}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  color: isTopThree ? "#e8e8e8" : "#aaa",
                  fontWeight: isTopThree ? 700 : 400,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {entry.playerName}
              </span>

              {/* Score */}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.65rem",
                  color: isTopThree ? "#f0c030" : "#aaa",
                  fontWeight: isTopThree ? 700 : 400,
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
            padding: "20px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            color: "#666",
          }}
        >
          No scores yet. Be the first!
        </div>
      )}

      {/* Footer note */}
      <div
        style={{
          marginTop: "8px",
          paddingTop: "6px",
          borderTop: "1px solid #3a3a3a",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "0.5rem",
          color: "#555",
          textAlign: "center",
          letterSpacing: "0.05em",
        }}
      >
        {isLoading
          ? "Fetching from ICP..."
          : `${displayScores.length} hunters ranked`}
      </div>
    </div>
  );
}
