import {
  AlertProps,
  Badge,
  Box,
  Button,
  Header,
} from "@cloudscape-design/components";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { sessionCookieName } from "../../../../../common/constant";
import { BoardItem } from "@cloudscape-design/board-components";
import { useUserAttributes } from "../../../../../common/api";
import { Avatar } from "@cloudscape-design/chat-components";
import { useHumanNewMove } from "../../../api/mutations";
import { UseQueryResult } from "@tanstack/react-query";
import { SessionRecord } from "../../../../../API";
import { Chessboard } from "react-chessboard";
import { useForm } from "react-hook-form";
import { useCookies } from "react-cookie";
import { SQUARES } from "chess.js";

interface IChatWindow {
  board: any;
  winnerUseState: [string, Dispatch<SetStateAction<string>>];
  session: UseQueryResult<SessionRecord>;
  latestMove: UseQueryResult<any>;
  alertUseState: [AlertProps, Dispatch<SetStateAction<AlertProps>>];
}

export const ChessBoardWindow = (props: IChatWindow) => {
  const {
    board,
    winnerUseState: [winner, setWinner],
    session,
    latestMove,
    alertUseState: [alertStatus, setAlertStatus],
  } = props;

  const [showPossibleMoves, setShowPossibleMoves] = useState([]);
  const [cookies] = useCookies([sessionCookieName]);
  const [highlights, setHighlights] = useState({});

  const { handleSubmit, setValue, watch } = useForm();

  const userAttributes = useUserAttributes();
  const humanMove = useHumanNewMove();

  const toSq = watch("chessboard.to");
  const fromSq = watch("chessboard.from");
  const lastPieceSelected = watch("chessboard.piece");

  useEffect(() => {
    if (session.data.GameStatus !== "PLAYING") {
      setValue("chessboard.to", null);
      setValue("chessboard.from", null);
    }
  }, [session.data.GameStatus]);

  const onSubmit = async (data) => {
    const { chessboard } = data;

    const tempBoard = board.playMove(`${chessboard.from}-${chessboard.to}`, {
      isMockMove: true,
    });

    try {
      await humanMove.mutateAsync({
        SessionID: cookies.GenAIChessDemoSessionID,
        Move: tempBoard.fen,
        Action: "MOVE",
      });
    } catch (error) {
      setValue("chessboard.to", null);
      setAlertStatus({
        ...alertStatus,
        children: <pre>{JSON.stringify(error, null, 2)}</pre>,
      });
    }
  };

  //  Chess Board
  const [boardDiv, setBoardDiv] = useState({ height: 500, width: 500 });
  const boardDivRef = useRef(null);
  useEffect(() => {
    const { current } = boardDivRef;

    if (current?.clientHeight && current?.offsetWidth)
      setBoardDiv({
        height: current?.clientHeight,
        width: current?.offsetWidth,
      });
  }, [boardDivRef.current?.clientHeight, boardDivRef.current?.offsetWidth]);

  //  Top Avatar
  const [topAvatarBox, setTopAvatarBox] = useState(0);
  const topAvatarRef = useRef(null);
  useEffect(() => {
    const { current } = topAvatarRef;
    if (current?.clientHeight) setTopAvatarBox(current?.clientHeight);
  }, [topAvatarRef.current?.clientHeight]);

  //  Bottom Avatar
  const [btmAvatarBox, setBtmAvatarBox] = useState(0);
  const btmAvatarRef = useRef(null);
  useEffect(() => {
    const { current } = btmAvatarRef;
    if (current?.clientHeight) setBtmAvatarBox(current?.clientHeight);
  }, [btmAvatarRef.current?.clientHeight]);

  // If LatestMove updates
  useEffect(() => {
    const { GameWinner, SfnExecutionId, TaskToken } = latestMove.data;

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

    if (!!GameWinner || (!SfnExecutionId && !TaskToken)) {
      setValue("chessboard.to", null);
      setValue("chessboard.from", null);
      setShowPossibleMoves([]);
    }
  }, [latestMove.data]);

  // Show moves you can make from a piece
  useEffect(() => {
    (async () => {
      const { WhiteID, BlackID } = session.data;

      let possibleMoves = [];

      switch (lastPieceSelected?.[0]) {
        // If the piece is white
        // and white player ID matches
        case "w":
          if (WhiteID === userAttributes.data.email) {
            possibleMoves = board.legalMoves(fromSq);
          }
          break;
        // Otherwise it's a black piece, likewise only grant if you are the black player ID
        case "b":
          if (BlackID === userAttributes.data.email) {
            possibleMoves = board.legalMoves(fromSq);
          }
          break;
      }

      const styles = {};
      for (const sq of SQUARES) {
        if (possibleMoves.map((move) => move.slice(-2)).includes(sq)) {
          styles[sq] = {
            backgroundColor: "rgba(60,59,56,0.25)",
            borderRadius: "75px",
          };
        } else if (sq === fromSq) {
          styles[sq] = {
            backgroundColor: "rgba(255, 174, 66,.5)",
          };
        }
      }
      setShowPossibleMoves(possibleMoves);
      setHighlights(styles);
    })();
  }, [fromSq]);

  // If we select a toSq we need to submit that move
  useEffect(() => {
    // If we have a toSq submit
    if (toSq) {
      const styles = {};

      for (const square of SQUARES) {
        if ([fromSq, toSq].includes(square)) {
          styles[square] = {
            animation: "blinkingBackground 1s infinite alternate",
          };
        }
      }

      setHighlights(styles);
    } else {
      // Otherwise clean all highlights on the board
      setHighlights({});
    }
  }, [toSq]);

  const indicatorStatus = (latestMove: {
    TaskToken: string;
    SfnExecutionId: string;
  }) => {
    if (winner) {
      return <Box variant="awsui-key-label">🎉 {winner} 🎉</Box>;
    } else if (latestMove.TaskToken) {
      return <>🦾 - Awaiting Movement</>;
    } else if (latestMove.SfnExecutionId) {
      return <>🤔 - Model Thinking</>;
    } else {
      return <>😐 - Idle</>;
    }
  };

  return (
    <form style={{ display: "contents" }} onSubmit={handleSubmit(onSubmit)}>
      <BoardItem
        disableContentPaddings
        header={
          <Header
            actions={
              <Button formAction="none">
                {indicatorStatus(latestMove.data)}
              </Button>
            }
          >
            Board
          </Header>
        }
        i18nStrings={{
          dragHandleAriaLabel: "Drag handle",
          resizeHandleAriaLabel: "Resize handle",
        }}
      >
        <div
          ref={boardDivRef}
          style={{
            backgroundColor: "#040724",
            justifyContent: "center",
            display: "flex",
            height: "100%",
            alignItems: "center",
          }}
        >
          <div>
            {/* Black Banner */}
            <div
              ref={topAvatarRef}
              style={{
                display: "flex",
                gap: 10,
                paddingBottom: "20px",
                alignItems: "center",
              }}
            >
              <Avatar
                loading={
                  !!latestMove.data.SfnExecutionId && board.activeColor === "b"
                }
                iconName={
                  session.data.BlackID.includes("@") ? "user-profile" : "gen-ai"
                }
                color={
                  session.data.BlackID.includes("@") ? "default" : "gen-ai"
                }
                ariaLabel="Avatar"
                tooltipText={
                  session.data.BlackID.includes("@") ? "Human" : "GenAI"
                }
              />

              <Box variant="awsui-key-label">{session.data.BlackID}</Box>

              <div>
                {board.activeColor === "b" && !latestMove.data.GameWinner && (
                  <Badge color="green">Turn</Badge>
                )}
              </div>
            </div>

            <Chessboard
              boardWidth={Math.min(
                boardDiv.width - 50,
                boardDiv.height - topAvatarBox - btmAvatarBox
              )}
              position={latestMove.data.Move}
              autoPromoteToQueen
              arePiecesDraggable={false}
              customSquareStyles={highlights}
              customDarkSquareStyle={{
                backgroundColor: "#7B2CBF",
              }}
              customLightSquareStyle={{
                backgroundColor: "#F0D9FF",
              }}
              customBoardStyle={{
                borderRadius: "5px",
              }}
              onSquareClick={(square) => {
                if (showPossibleMoves.includes(square)) {
                  // Otherwise make the move
                  setValue("chessboard.to", square);
                  handleSubmit(onSubmit)();
                } else {
                  // When we select a square show it's possible moves
                  setValue("chessboard.from", square);
                }
              }}
              onPieceClick={(piece) => {
                if (session.data.GameStatus === "PLAYING" && !winner) {
                  setValue("chessboard.piece", piece);
                } else {
                  setValue("chessboard.piece", null);
                }
              }}
            />

            {/* White Banner */}
            <div
              ref={btmAvatarRef}
              style={{
                display: "flex",
                gap: 10,
                padding: "20px 0",
                alignItems: "center",
              }}
            >
              <Avatar
                loading={
                  !!latestMove.data.SfnExecutionId && board.activeColor === "w"
                }
                iconName={
                  session.data.WhiteID.includes("@") ? "user-profile" : "gen-ai"
                }
                color={
                  session.data.WhiteID.includes("@") ? "default" : "gen-ai"
                }
                ariaLabel="Avatar"
                tooltipText={
                  session.data.WhiteID.includes("@") ? "Human" : "GenAI"
                }
              />

              <Box variant="awsui-key-label">{session.data.WhiteID}</Box>

              <div>
                {board.activeColor === "w" && !latestMove.data.GameWinner && (
                  <Badge color="green">Turn</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </BoardItem>
    </form>
  );
};
