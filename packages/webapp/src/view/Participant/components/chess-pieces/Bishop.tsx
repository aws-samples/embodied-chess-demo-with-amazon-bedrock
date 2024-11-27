import type { FC } from "react";

import { useGLTF } from "@react-three/drei";
import type { GLTF } from "three-stdlib";
import type * as THREE from "three";

type GLTFResult = GLTF & {
  nodes: {
    Object001002: THREE.Mesh;
  };
  materials: {
    [`Object001_mtl.003`]: THREE.MeshStandardMaterial;
  };
};

export const BishopModel: FC = () => {
  const { nodes } = useGLTF(`/chess/bishop.gltf`) as unknown as GLTFResult;
  return <mesh attach="geometry" {...nodes.Object001002.geometry} />;
};

useGLTF.preload(`/chess/bishop.gltf`);
