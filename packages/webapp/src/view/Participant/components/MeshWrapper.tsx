import { motion } from "framer-motion-3d";
import { useRef } from "react";
import { animated } from "@react-spring/three";

export const MeshWrapper = ({ children, color, ...props }) => {
  const ref = useRef(null);
  const meshRef = useRef(null);

  return (
    <group ref={ref} {...props} dispose={null} castShadow>
      <motion.mesh ref={meshRef} scale={0.03} receiveShadow initial={false}>
        {children}
        <animated.meshPhysicalMaterial
          color={color === "white" ? "white" : "#7c7c7c"}
          metalness={1}
          roughness={0.5}
          attach="material"
          envMapIntensity={0.3}
          transparent={true}
          {...props}
        />
      </motion.mesh>
    </group>
  );
};
