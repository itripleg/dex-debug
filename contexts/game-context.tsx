"use client";
import GameOver from "@/game-components/GameOver";
import { OrbitControls } from "@react-three/drei";
import { AnimationControls, useAnimation } from "framer-motion";
import * as THREE from "three";
import {
  RefObject,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PerspectiveCamera } from "three";

type Target = "hero" | "enemy";
type GameStatus = "running" | "stopped" | "won" | "lost";

type Context = {
  gameTimer: number;
  setGameTimer: React.Dispatch<React.SetStateAction<number>>;
  heroHealth: number;
  bossHealth: number;
  applyDamage: (target: Target, amount: number) => void;
  gameStatus: GameStatus;
  startGame: () => void;
  stopGame: () => void;
  checkGameStatus: () => void;
  gameRestart: boolean;
  cameraRef: RefObject<PerspectiveCamera | null>;
  controlRef: RefObject<typeof OrbitControls | null>;
  animationControls: AnimationControls;
  bossEyeRef: RefObject<THREE.Object3D | null>;
  battle: boolean;
  wallpaper: string;
  setWallpaper: (wallpaper: string) => void;
  cameraZPosition: number;
  setCameraZPosition: (position: number) => void;
  jaxMessage: string;
  setJaxMessage: (message: string) => void;
  ouijaMessage: string;
  setOuijaMessage: (message: string) => void;
  setBossHealth: (health: number) => void;
  view: string;
  setView: (view: string) => void;
};

export const GameContext = createContext<Context | null>(null);

type Props = { children: React.ReactNode };

export default function GameContextProvider({ children }: Props) {
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlRef = useRef<typeof OrbitControls | null>(null);
  const bossEyeRef = useRef<THREE.Object3D | null>(null);
  const [gameTimer, setGameTimer] = useState(0);
  const [heroHealth, setHeroHealth] = useState(100);
  const [bossHealth, setBossHealth] = useState(100);
  const [gameStatus, setGameStatus] = useState<GameStatus>("stopped");
  const [gameRestart, setGameRestart] = useState(false);
  const [battle, setBattle] = useState(false);
  const [jaxMessage, setJaxMessage] = useState("Here we go again.");
  const [ouijaMessage, setOuijaMessage] = useState("");
  const [wallpaper, setWallpaper] = useState("");
  const [view, setView] = useState("default");
  const [cameraZPosition, setCameraZPosition] = useState(10);
  const animationControls = useAnimation();

  const startGame = () => {
    setGameStatus("running");
    setGameRestart(true);
    setGameTimer(0);
    setHeroHealth(100);
    setBossHealth(100);
    setBattle(true);
  };

  const stopGame = () => {
    setGameStatus("stopped");
    clearInterval(gameTimer);
    setBattle(false);
  };

  const checkGameStatus = () => {
    if (heroHealth <= 0) {
      setGameStatus("lost");
      console.log("You lost.");
      stopGame();
      return <GameOver win={false} />;
    } else if (bossHealth <= 0) {
      setGameStatus("won");
      console.log("You won.");
      stopGame();
      return <GameOver win={true} />;
    }
  };

  const applyDamage = (target: Target, amount: number) => {
    if (target === "hero") {
      setHeroHealth((prev) => Math.max(prev - amount, 0));
    } else if (target === "enemy") {
      setBossHealth((prev) => Math.max(prev - amount, 0));
    }
  };

  useEffect(() => {
    if (gameRestart) {
      setGameRestart(false);
    }

    let interval: NodeJS.Timeout;
    if (gameStatus === "running") {
      interval = setInterval(() => {
        setGameTimer((prevTimer) => prevTimer + 1);
      }, 1000);
    }

    if (heroHealth <= 0) {
      setGameStatus("lost");
      console.log("You lost.");
    } else if (bossHealth <= 0) {
      setGameStatus("won");
      console.log("You won.");
    }

    return () => clearInterval(interval);
  }, [gameStatus, gameRestart, heroHealth, bossHealth]);

  return (
    <GameContext.Provider
      value={{
        gameTimer,
        setGameTimer,
        heroHealth,
        bossHealth,
        applyDamage,
        gameStatus,
        startGame,
        stopGame,
        gameRestart,
        checkGameStatus,
        cameraRef,
        controlRef,
        animationControls,
        bossEyeRef,
        battle,
        wallpaper,
        setWallpaper,
        cameraZPosition,
        setCameraZPosition,
        jaxMessage,
        setJaxMessage,
        ouijaMessage,
        setOuijaMessage,
        setBossHealth,
        view,
        setView,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("Error must consume from within GameContextProvider");
  }
  return context;
}
