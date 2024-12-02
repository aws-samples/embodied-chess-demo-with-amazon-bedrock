import {
  Alert,
  Header,
  KeyValuePairs,
  PieChart,
  StatusIndicator,
} from "@cloudscape-design/components";

import {
  Board,
  BoardItem,
  BoardProps,
} from "@cloudscape-design/board-components";

import { onUpdateLatestMove } from "../../../../graphql/subscriptions";
import { useGetLatestMove, useGetSession } from "../../api/queries";
import { ThreeChessBoard } from "../../components/ThreeChessBoard";
import { WinnerModal } from "../../components/WinnerModal";
import { navHeightPxAtom } from "../../../../common/atom";
import { createGlobalStyle } from "styled-components";
import { useEffect, useRef, useState } from "react";
import { generateClient } from "aws-amplify/api";
import { Environment } from "@react-three/drei";
import { Chessboard } from "react-chessboard";
import { Canvas } from "@react-three/fiber";
import { useCookies } from "react-cookie";
import { ChatWindow } from "./ChatWindow";
import { compact, reduce } from "lodash";
import { Ic } from "isepic-chess";
import { Chess } from "chess.js";
import { useAtom } from "jotai";
import { Leva } from "leva";

const GlobalStyle = createGlobalStyle`
  div[class*='awsui_content-wrapper'] > [class*='awsui_'] {
    background-color: #040724 !important;
  }

  div[class*='awsui_title_'] {
    color: white !important;
  }

  div[class*='awsui_grid_'] {
    gap: 15px !important;
  }

  g[class*='awsui_label'] > text {
    fill: white !important;
  }

  label[class*='awsui_key'] {
    color: white !important;
  }

  dd[class*='awsui_detail'] {
    color: white !important;
  }

  div[class*='awsui_marker'] {
    color: white !important;
  }
`;

const createAnnouncement = (operationAnnouncement, conflicts, disturbed) => {
  const conflictsAnnouncement =
    conflicts.length > 0
      ? `Conflicts with ${conflicts.map((c) => c.data.title).join(", ")}.`
      : "";
  const disturbedAnnouncement =
    disturbed.length > 0 ? `Disturbed ${disturbed.length} items.` : "";
  return [operationAnnouncement, conflictsAnnouncement, disturbedAnnouncement]
    .filter(Boolean)
    .join(" ");
};

export const ThreeDimensional = () => {
  const [cookies] = useCookies();

  const [navHeight] = useAtom(navHeightPxAtom);

  const latestMove = useGetLatestMove(cookies.GenAIChessDemoSessionID);
  const session = useGetSession(cookies.GenAIChessDemoSessionID);

  const [isepicBoard, setIsepicBoard] = useState(
    Ic.initBoard({ fen: latestMove.data.Move })
  );

  const scoreCard = (side: string) => {
    return reduce(
      Ic.countPieces(latestMove.data.Move)[side],
      (result, value, key) => {
        if (!value) return result;
        switch (key) {
          case "p":
            return result + 1;
          case "n":
            return result + 3;
          case "b":
            return result + 3;
          case "r":
            return result + 5;
          case "q":
            return result + 9;
          default:
            return result + 1;
        }
      },
      0
    );
  };

  const [board, setBoard] = useState(new Chess(latestMove.data.Move));
  const [winnerModal, setWinnerModal] = useState(false);
  const [winner, setWinner] = useState(null);

  // If LatestMove updates
  useEffect(() => {
    const { GameWinner } = latestMove.data;

    if (GameWinner) {
      switch (GameWinner) {
        case "w":
          setWinner("White");
          break;
        case "b":
          setWinner("Black");
          break;
        default:
          setWinner("Draw");
      }
    }

    setBoard(new Chess(latestMove.data.Move));
    setIsepicBoard(Ic.initBoard({ fen: latestMove.data.Move }));
  }, [latestMove.data]);

  useEffect(() => {
    if (winner) {
      setWinnerModal(true);
    }
  }, [winner]);

  const [items, setItems] = useState<BoardProps.Item[]>([
    {
      id: "Chat",
      rowSpan: Math.floor((window.innerHeight - navHeight - 15) / 111),
      columnSpan: 1,
      data: null,
    },
    {
      id: "3D",
      rowSpan: Math.round(
        Math.floor((window.innerHeight - navHeight - 15) / 111) * 0.6
      ),
      columnSpan: 2,
      data: null,
    },
    {
      id: "Chessboard",
      rowSpan: Math.round(
        Math.floor((window.innerHeight - navHeight - 15) / 111) * 0.6
      ),
      columnSpan: 1,
      data: null,
    },
    {
      id: "Advantage",
      rowSpan: Math.round(
        Math.floor((window.innerHeight - navHeight - 15) / 111) * 0.4
      ),
      columnSpan: 1,
      data: null,
    },
    {
      id: "Game Details",
      rowSpan: Math.round(
        Math.floor((window.innerHeight - navHeight - 15) / 111) * 0.4
      ),
      columnSpan: 2,
      data: null,
    },
  ]);

  //  ChessBoard
  const [boardDiv, setBoardDiv] = useState({ height: 200, width: 200 });
  const boardDivRef = useRef(null);
  useEffect(() => {
    const { current } = boardDivRef;

    if (current?.clientHeight && current?.offsetWidth)
      setBoardDiv({
        height: current?.clientHeight,
        width: current?.offsetWidth,
      });
  }, [boardDivRef.current?.clientHeight, boardDivRef.current?.offsetWidth]);

  return (
    <>
      <div style={{ height: "100%" }}>
        <GlobalStyle />

        <div style={{ padding: 15, height: "100%" }}>
          <Board
            items={items}
            renderItem={({ id }) => {
              switch (id) {
                case "Chat":
                  return <ChatWindow board={board} />;
                case "3D":
                  return (
                    <BoardItem
                      disableContentPaddings
                      header={<Header>3D</Header>}
                      i18nStrings={{
                        dragHandleAriaLabel: "Drag handle",
                        resizeHandleAriaLabel: "Resize handle",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          bottom: 5,
                          right: 5,
                          zIndex: 1,
                        }}
                      >
                        <Leva fill hideCopyButton titleBar={false} />
                      </div>
                      <Canvas
                        shadows
                        style={{ borderRadius: "0 0 16px 16px" }}
                        camera={{ position: [-5, 4, 8], fov: 50 }}
                      >
                        <Environment background files="venice_sunset_1k.hdr" />
                        <ThreeChessBoard autoRotate latestMove={latestMove} />
                      </Canvas>
                    </BoardItem>
                  );
                case "Chessboard":
                  return (
                    <BoardItem
                      disableContentPaddings
                      header={<Header>Chessboard</Header>}
                      i18nStrings={{
                        dragHandleAriaLabel: "Drag handle",
                        resizeHandleAriaLabel: "Resize handle",
                      }}
                    >
                      <div
                        ref={boardDivRef}
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          backgroundColor: "#040724",
                          height: "95%",
                        }}
                      >
                        <div>
                          <Chessboard
                            boardWidth={Math.min(
                              boardDiv.width - 30,
                              boardDiv.height
                            )}
                            position={latestMove.data.Move}
                            customBoardStyle={{
                              borderRadius: "5px",
                            }}
                            arePiecesDraggable={false}
                            customDarkSquareStyle={{
                              backgroundColor: "#7B2CBF",
                            }}
                            customLightSquareStyle={{
                              backgroundColor: "#F0D9FF",
                            }}
                          />
                        </div>
                      </div>
                    </BoardItem>
                  );
                case "Advantage":
                  return (
                    <BoardItem
                      header={<Header>{id}</Header>}
                      i18nStrings={{
                        dragHandleAriaLabel: "Drag handle",
                        resizeHandleAriaLabel: "Resize handle",
                      }}
                    >
                      <PieChart
                        fitHeight
                        hideFilter
                        size="small"
                        segmentDescription={(datum, sum) =>
                          `${datum.value} units, ${(
                            (datum.value / sum) *
                            100
                          ).toFixed(0)}%`
                        }
                        data={[
                          {
                            title: "White",
                            value: scoreCard("w"),
                          },
                          {
                            title: "Black",
                            value: scoreCard("b"),
                          },
                        ]}
                      />
                    </BoardItem>
                  );
                case "Game Details":
                  return (
                    <BoardItem
                      header={<Header>Game Details</Header>}
                      i18nStrings={{
                        dragHandleAriaLabel: "Drag handle",
                        resizeHandleAriaLabel: "Resize handle",
                      }}
                    >
                      <KeyValuePairs
                        columns={3}
                        items={compact([
                          {
                            label: "White",
                            value: session.data.White,
                          },
                          ["bedrock"].includes(session.data.White) && {
                            label: "Model Name (White)",
                            value: session.data.WhiteID,
                          },
                          {
                            label: "Active Color",
                            value:
                              isepicBoard.activeColor === "w"
                                ? "White"
                                : "Black",
                          },
                          {
                            label: "Black",
                            value: session.data.Black,
                          },
                          ["bedrock"].includes(session.data.Black) && {
                            label: "Model Name (Black)",
                            value: session.data.BlackID,
                          },
                          {
                            label: "Full Move",
                            value: isepicBoard.fullMove,
                          },
                          {
                            label: "Half Moves",
                            value: isepicBoard.halfMove,
                          },

                          {
                            label: "Checkmate",
                            value: isepicBoard.isCheckmate ? (
                              <StatusIndicator />
                            ) : (
                              <StatusIndicator type="error" />
                            ),
                          },
                          {
                            label: "Check",
                            value: isepicBoard.isCheck ? (
                              <StatusIndicator />
                            ) : (
                              <StatusIndicator type="error" />
                            ),
                          },
                          {
                            label: "Draw",
                            value: isepicBoard.inDraw ? (
                              <StatusIndicator />
                            ) : (
                              <StatusIndicator type="error" />
                            ),
                          },
                        ])}
                      />
                    </BoardItem>
                  );
                default:
                  return (
                    <BoardItem
                      header={<Header>{id}</Header>}
                      i18nStrings={{
                        dragHandleAriaLabel: "Drag handle",
                        resizeHandleAriaLabel: "Resize handle",
                      }}
                    >
                      <Alert type="error">
                        Board item title ID not recognised
                      </Alert>
                    </BoardItem>
                  );
              }
            }}
            i18nStrings={(() => {
              return {
                liveAnnouncementDndStarted: (operationType) =>
                  operationType === "resize" ? "Resizing" : "Dragging",
                liveAnnouncementDndItemReordered: (operation) => {
                  const columns = `column ${operation.placement.x + 1}`;
                  const rows = `row ${operation.placement.y + 1}`;
                  return createAnnouncement(
                    `Item moved to ${
                      operation.direction === "horizontal" ? columns : rows
                    }.`,
                    operation.conflicts,
                    operation.disturbed
                  );
                },
                liveAnnouncementDndItemResized: (operation) => {
                  const columnsConstraint = operation.isMinimalColumnsReached
                    ? " (minimal)"
                    : "";
                  const rowsConstraint = operation.isMinimalRowsReached
                    ? " (minimal)"
                    : "";
                  const sizeAnnouncement =
                    operation.direction === "horizontal"
                      ? `columns ${operation.placement.width}${columnsConstraint}`
                      : `rows ${operation.placement.height}${rowsConstraint}`;
                  return createAnnouncement(
                    `Item resized to ${sizeAnnouncement}.`,
                    operation.conflicts,
                    operation.disturbed
                  );
                },
                liveAnnouncementDndItemInserted: (operation) => {
                  const columns = `column ${operation.placement.x + 1}`;
                  const rows = `row ${operation.placement.y + 1}`;
                  return createAnnouncement(
                    `Item inserted to ${columns}, ${rows}.`,
                    operation.conflicts,
                    operation.disturbed
                  );
                },
                liveAnnouncementDndCommitted: (operationType) =>
                  `${operationType} committed`,
                liveAnnouncementDndDiscarded: (operationType) =>
                  `${operationType} discarded`,
                liveAnnouncementItemRemoved: (op: any) =>
                  createAnnouncement(
                    `Removed item ${op.item.data.title}.`,
                    [],
                    op.disturbed
                  ),
                navigationAriaLabel: "Board navigation",
                navigationAriaDescription:
                  "Click on non-empty item to move focus over",
                navigationItemAriaLabel: (item: any) =>
                  item ? item.data.title : "Empty",
              };
            })()}
            onItemsChange={(event) => setItems(event.detail.items as any)}
            empty={
              <Alert type="error">There was an error rendering this page</Alert>
            }
          />
        </div>
      </div>

      <WinnerModal
        modalUseState={[winnerModal, setWinnerModal]}
        session={session.data}
        winner={winner}
      />

      <PageSubscriptions refetch={latestMove.refetch} />
    </>
  );
};

const PageSubscriptions = ({ refetch }) => {
  const client = generateClient();

  useEffect(() => {
    const updateLatestMove = client
      .graphql({ query: onUpdateLatestMove })
      .subscribe({
        next: () => refetch(),
      });

    return () => {
      updateLatestMove.unsubscribe();
    };
  }, []);

  return null;
};
