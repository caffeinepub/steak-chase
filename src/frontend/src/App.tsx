import { useState } from "react";
import { GameScreen } from "./components/GameScreen";
import { SplashScreen } from "./components/SplashScreen";

type Screen = "splash" | "playing";

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [muted, setMuted] = useState(false);

  return (
    <div className="dark" style={{ minHeight: "100vh", background: "#0d1a06" }}>
      {screen === "splash" && (
        <SplashScreen
          onPlay={() => setScreen("playing")}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
        />
      )}
      {screen === "playing" && (
        <GameScreen
          onReturnToMenu={() => setScreen("splash")}
          muted={muted}
          onToggleMute={() => setMuted((m) => !m)}
        />
      )}
    </div>
  );
}
