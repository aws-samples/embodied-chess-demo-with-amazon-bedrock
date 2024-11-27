import type { FC } from "react";

import { useGLTF } from "@react-three/drei";
import type * as THREE from "three";
import type { GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    Object001005: THREE.Mesh;
  };
  materials: {
    [`Object001_mtl.003`]: THREE.MeshStandardMaterial;
  };
};

export const KnightModel: FC = () => {
  const { nodes } = useGLTF(`/chess/knight.gltf`) as unknown as GLTFResult;
  return <mesh attach="geometry" {...nodes.Object001005.geometry} />;
};

useGLTF.preload(`/chess/knight.gltf`);
