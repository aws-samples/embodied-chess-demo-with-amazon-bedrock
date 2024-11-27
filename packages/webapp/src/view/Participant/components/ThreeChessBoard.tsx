import { OrbitControls } from "@react-three/drei";
import { BishopModel } from "./chess-pieces/Bishop";
import { CastleModel } from "./chess-pieces/Castle";
import { KingModel } from "./chess-pieces/King";
import { KnightModel } from "./chess-pieces/Knight";
import { PawnModel } from "./chess-pieces/Pawn";
import { QueenModel } from "./chess-pieces/Queen";
import { MeshWrapper } from "./MeshWrapper";
import { TileComponent } from "./TileComponent";
import { useControls } from "leva";

const isLowercase = (char: string) => {
  const code = char.charCodeAt(0);

  if (code >= 97 && code <= 122) {
    return true;
  } else {
    false;
  }
};

export const ThreeChessBoard = ({ autoRotate = false, latestMove }) => {
  const orbitControls = useControls({
    speed: { value: 0.5, min: 0, max: 10 },
  });

  return (
    <group position={[-3.5, -0.5, -3.5]}>
      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={orbitControls.speed}
        maxDistance={25}
        minDistance={7}
        enableZoom={true}
        enablePan={false}
      />
      <pointLight
        shadow-mapSize={[2048, 2048]}
        castShadow
        position={[1, 10, 3.5]}
        intensity={0.65}
        color="#ffe0ec"
      />
      <hemisphereLight intensity={0.5} color="#ffa4a4" groundColor="#d886b7" />

      <group>
        {[...Array(8).keys()].map((_, x) => {
          return [...Array(8).keys()].map((_, y) => {
            return (
              <TileComponent
                key={`${x}${y}`}
                color={`${(x + y) % 2 === 0 ? "light" : "dark"}`}
                position={[x, 0, y]}
              />
            );
          });
        })}

        {!!latestMove.data.Move
          ? latestMove.data.Move.split(" ")[0]
              .split("/")
              .map((row: string) => {
                const rowSeg = [];

                for (const letter of row) {
                  if (isNaN(letter as any)) {
                    rowSeg.push(letter);
                  } else {
                    rowSeg.push(...new Array(parseInt(letter)).fill(null));
                  }
                }

                return rowSeg;
              })
              .map((x: string[], index_x: number) => {
                return x.map((y: string, index_y: number) => {
                  return (
                    y && (
                      <MeshWrapper
                        key={`${y}_${index_x}_${index_y}`}
                        position={[index_y, 0.25, index_x]}
                        scale={[0.15, 0.15, 0.15]}
                        color={isLowercase(y) ? "black" : "white"}
                      >
                        {y?.toLowerCase() === "k" && <KingModel />}
                        {y?.toLowerCase() === "q" && <QueenModel />}
                        {y?.toLowerCase() === "b" && <BishopModel />}
                        {y?.toLowerCase() === "n" && <KnightModel />}
                        {y?.toLowerCase() === "r" && <CastleModel />}
                        {y?.toLowerCase() === "p" && <PawnModel />}
                      </MeshWrapper>
                    )
                  );
                });
              })
          : null}
      </group>
    </group>
  );
};
