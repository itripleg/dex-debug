import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import { motion, useAnimation, AnimationControls } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import Moon from "@/components-3d/Moon";
import gsap from "gsap";
import OuijaAndFlecha from "@/components-3d/Ouija/OuijaAndFletcha";
import { Flecha } from "@/components-3d/Ouija/Flecha";
import { OuijaBoard } from "@/components-3d/Ouija/OuijaBoard";
import BossEye from "@/game-components/BossEye";
import GameContextProvider from "@/contexts/game-context";
import Jax from "@/Characters/Jax";

export const SpaceScene = ({ cameraRef, controlRef, lightRef }: any) => {
  const { theme } = useTheme();

  const animationControls: AnimationControls = useAnimation();

  useEffect(() => {
    if (lightRef?.current) {
      gsap.to(lightRef.current, {
        intensity: theme === "dark" ? 0.3 : 1,
        duration: 2.5,
      });
    }
  }, [theme]);

  return (
    <motion.div
      className="absolute left-0 right-0 w-full h-[1200px] top-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 6, delay: 0 }}
    >
      <Canvas>
        <ambientLight intensity={1} ref={lightRef} />
        <directionalLight position={[0, 10, 0]} />
        <OrbitControls
          ref={controlRef}
          enableZoom={false}
          enablePan={true}
          enableRotate={false}
          // autoRotate
          autoRotateSpeed={0.01}
        />
        <PerspectiveCamera position={[0, 0, -7]} ref={cameraRef} makeDefault />
        <Moon scale={2} position={[0, 1.1, 0]} />
        <Stars radius={100} />
        {/* <Planet /> */}
        {/* <OuijaAndFlecha position={[666, 666, 666]} /> */}
        {/* <OuijaBoard position={[0, 0, 0]} scale={20} /> */}
        {/* <Flecha animationControls={animationControls} /> */}
        {/* <OuijaBoard /> */}
        {/* <GameContextProvider> */}
        {/* <BossEye /> */}
        {/* <OuijaBoard position={[555, 555, 555]} scale={2} /> */}
        {/* </GameContextProvider> */}
      </Canvas>
      {/* <OuijaAndFlecha position={[0, 0, 0]} /> */}
    </motion.div>
  );
};
