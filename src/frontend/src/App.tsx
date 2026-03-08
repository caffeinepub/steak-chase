import { useState } from "react";
import { GameScreen } from "./components/GameScreen";
import { SplashScreen } from "./components/SplashScreen";

type Screen = "splash" | "playing";

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");

  return (
    <div className="dark" style={{ minHeight: "100vh", background: "#0d1a06" }}>
      {screen === "splash" && (
        <SplashScreen onPlay={() => setScreen("playing")} />
      )}
      {screen === "playing" && (
        <GameScreen onReturnToMenu={() => setScreen("splash")} />
      )}
    </div>
  );
}
