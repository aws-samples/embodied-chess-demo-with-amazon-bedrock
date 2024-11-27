import {
  ChatContainer,
  MessageList,
  Message,
} from "@chatscope/chat-ui-kit-react";

import {
  Badge,
  Button,
  Header,
  SpaceBetween,
} from "@cloudscape-design/components";
import { sessionCookieName } from "../../../../../common/constant";
import { BoardItem } from "@cloudscape-design/board-components";
import { useFieldArray, useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { useGetMoves } from "../../../api/queries";
import { MoveRecord } from "../../../../../API";
import { Chessboard } from "react-chessboard";
import { useCookies } from "react-cookie";
import { Leva, useControls } from "leva";
import { Ic } from "isepic-chess";

type FormValues = {
  moves: MoveRecord[];
};

export const MoveWindow = ({ latestMove }) => {
  const [cookies] = useCookies([sessionCookieName]);

  const moves = useGetMoves(cookies.GenAIChessDemoSessionID, 10);

  const scrollChatRef = useRef(null);

  const moveWindowConfig = useControls({
    autoScroll: true,
  });

  const { control } = useForm<FormValues>();
  const { fields, replace, append, prepend } = useFieldArray({
    control,
    name: "moves",
  });

  useEffect(() => {
    if (moves.isSuccess) {
      replace(moves.data.pages[0].items.reverse());
    }
  }, [moves.isSuccess]);

  useEffect(() => {
    if (fields.length && latestMove.Move !== fields[fields.length - 1]?.Move) {
      append(latestMove);
    }

    if (moveWindowConfig.autoScroll) {
      (async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        scrollChatRef.current?.scrollToBottom();
      })();
    }
  }, [latestMove]);

  useEffect(() => {
    if (
      moves.isSuccess &&
      !moves.isFetching &&
      moves.data.pages.length > 1 &&
      moves.data.pages.length > fields.length / 10
    ) {
      prepend(moves.data.pages[moves.data.pages.length - 1].items.reverse());
    }
  }, [moves.isFetching]);

  //  Chessboard
  const msgDivRef = useRef(null);
  const [boardDiv, setBoardDiv] = useState(350);
  useEffect(() => {
    const { current } = msgDivRef;

    if (current?.offsetWidth) setBoardDiv(current?.offsetWidth);
  }, [msgDivRef.current, msgDivRef.current?.offsetWidth]);

  return (
    <BoardItem
      header={
        <Header
          actions={
            <Leva
              fill
              hideCopyButton
              titleBar={false}
              theme={{
                sizes: {
                  controlWidth: "20px",
                },
              }}
            />
          }
        >
          Moves
        </Header>
      }
      disableContentPaddings
      i18nStrings={{
        dragHandleAriaLabel: "Drag handle",
        resizeHandleAriaLabel: "Resize handle",
      }}
    >
      <div
        style={{
          position: "relative",
          height: "100%",
        }}
      >
        <ChatContainer
          style={{
            position: "absolute",
            width: "100%",
          }}
        >
          <MessageList ref={scrollChatRef}>
            <div
              ref={msgDivRef}
              style={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <SpaceBetween size="xs" alignItems="center">
                {moves.hasNextPage ? (
                  <Button
                    loading={moves.isFetchingNextPage}
                    onClick={() => moves.fetchNextPage()}
                  >
                    Load Previous
                  </Button>
                ) : (
                  <>
                    <Chessboard
                      customDarkSquareStyle={{
                        backgroundColor: "#7D945D",
                      }}
                      customLightSquareStyle={{
                        backgroundColor: "#EBECD3",
                      }}
                      boardWidth={boardDiv - 150}
                      arePiecesDraggable={false}
                      customBoardStyle={{
                        borderRadius: "5px",
                      }}
                    />
                    <Badge color="green">Start State</Badge>
                  </>
                )}
              </SpaceBetween>
            </div>

            {fields
              .filter(({ Action }) => Action !== "INITIALISE_BOARD")
              .map(({ Move, id }, i, arr) => {
                const colour = Move.split(" ")[1];

                const chess = Ic.initBoard({ fen: arr[i - 1]?.Move });
                const playMove = chess.playMove(Move);

                return (
                  <Message
                    key={id}
                    model={{
                      position: "single",
                      direction: colour === "b" ? "outgoing" : "incoming",
                      type: "custom",
                    }}
                  >
                    <Message.CustomContent>
                      <Chessboard
                        customArrows={[
                          [playMove?.fromBos, playMove?.toBos, "red"],
                        ]}
                        customDarkSquareStyle={{
                          backgroundColor: "#7D945D",
                        }}
                        customLightSquareStyle={{
                          backgroundColor: "#EBECD3",
                        }}
                        key={Move}
                        position={Move}
                        boardWidth={boardDiv - 150}
                        arePiecesDraggable={false}
                      />

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        {colour === "b" ? "White" : "Black"}
                        {i === arr.length - 1 && (
                          <div style={{ marginTop: 8 }}>
                            <Badge color="blue">Latest Move</Badge>
                          </div>
                        )}
                      </div>
                    </Message.CustomContent>
                  </Message>
                );
              })}
          </MessageList>
        </ChatContainer>
      </div>
    </BoardItem>
  );
};
