import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ScoreEntry } from "../backend.d";
import { useActor } from "./useActor";

export function useLeaderboard() {
  const { actor, isFetching } = useActor();

  return useQuery<ScoreEntry[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      const scores = await actor.getTopScores();
      return scores.sort((a, b) => Number(b.score) - Number(a.score));
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useAddScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playerName,
      score,
    }: {
      playerName: string;
      score: number;
    }) => {
      if (!actor) throw new Error("No actor");
      await actor.addScore(playerName, BigInt(score));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
