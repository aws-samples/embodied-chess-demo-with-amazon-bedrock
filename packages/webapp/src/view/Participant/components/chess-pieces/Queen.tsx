import type { FC } from "react";

import { useGLTF } from "@react-three/drei";
import type * as THREE from "three";
import type { GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    Object001003: THREE.Mesh;
  };
  materials: {
    [`Object001_mtl.003`]: THREE.MeshStandardMaterial;
  };
};

export const QueenModel: FC = () => {
  const { nodes } = useGLTF(`/chess/queen.gltf`) as unknown as GLTFResult;
  return <mesh attach="geometry" {...nodes.Object001003.geometry} />;
};

useGLTF.preload(`/chess/queen.gltf`);
