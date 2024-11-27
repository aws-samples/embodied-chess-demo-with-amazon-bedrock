import { Alert, Header, Box, AlertProps } from "@cloudscape-design/components";
import Board, { BoardProps } from "@cloudscape-design/board-components/board";
import { onUpdateLatestMove } from "../../../../graphql/subscriptions";
import BoardItem from "@cloudscape-design/board-components/board-item";
import { ChessBoardWindow } from "./ChessBoardWindow/ChessBoardWindow";
import { useGetLatestMove, useGetSession } from "../../api/queries";
import { sessionCookieName } from "../../../../common/constant";
import { navHeightPxAtom } from "../../../../common/atom";
import { createGlobalStyle } from "styled-components";
import { ChatWindow } from "./ChatWindow/ChatWindow";
import { MoveWindow } from "./MoveWindow/MoveWindow";
import { generateClient } from "aws-amplify/api";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { Ic } from "isepic-chess";
import { useAtom } from "jotai";

import "./Control.css";
import { WinnerModal } from "../../components/WinnerModal";

const GlobalStyle = createGlobalStyle`
  div[class*='awsui_content-wrapper'] > [class*='awsui_header_'] {
    background-color: #040724 !important;
  }

  div[class*='awsui_title_'] {
    color: white !important;
  }

  div[class*='awsui_grid_'] {
    gap: 15px !important;
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

export const Controls = () => {
  const [winnerModal, setWinnerModal] = useState(false);
  const [cookies] = useCookies([sessionCookieName]);
  const [winner, setWinner] = useState<string>(null);
  const [board] = useState(Ic.initBoard());
  const [navHeight] = useAtom(navHeightPxAtom);

  const session = useGetSession(cookies.GenAIChessDemoSessionID);
  const latestMove = useGetLatestMove(cookies.GenAIChessDemoSessionID);

  const [alertStatus, setAlertStatus] = useState<AlertProps>({
    dismissible: true,
    onDismiss: () => {
      setAlertStatus({ ...alertStatus, children: "" });
    },
  });

  useEffect(() => {
    if (latestMove.data.Move) {
      board.loadFen(latestMove.data.Move);
    }
  }, [latestMove.data.Move]);

  useEffect(() => {
    if (winner) {
      setWinnerModal(true);
    }
  }, [winner]);

  const [items, setItems] = useState<BoardProps.Item[]>([
    {
      id: "Chat",
      rowSpan: Math.floor(window.innerHeight / 120),
      columnSpan: 1,
      data: null,
    },
    {
      id: "Board",
      rowSpan: Math.floor(window.innerHeight / 120),
      columnSpan: 2,
      data: null,
    },
    {
      id: "Moves",
      rowSpan: Math.floor(window.innerHeight / 120),
      columnSpan: 1,
      data: null,
    },
  ]);

  return (
    <div
      style={{
        height: `calc(100vh - ${navHeight}px)`,
        overflow: "clip",
      }}
    >
      <GlobalStyle />
      <Box padding={"l"}>
        {alertStatus.children && (
          <div
            style={{
              position: "fixed",
              width: "100vw",
              zIndex: 101,
              left: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Alert {...alertStatus} />
          </div>
        )}

        <Board
          items={items}
          onItemsChange={(event) => setItems(event.detail.items as any)}
          renderItem={({ id }) => {
            switch (id) {
              case "Chat":
                return (
                  <ChatWindow
                    alertUseState={[alertStatus, setAlertStatus]}
                    board={board}
                    session={session}
                  />
                );
              case "Board":
                return (
                  <ChessBoardWindow
                    board={board}
                    winnerUseState={[winner, setWinner]}
                    session={session}
                    latestMove={latestMove}
                    alertUseState={[alertStatus, setAlertStatus]}
                  />
                );
              case "Moves":
                return <MoveWindow latestMove={latestMove.data} />;
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
          empty={
            <Alert type="error">There was an error rendering this page</Alert>
          }
        />
      </Box>

      <WinnerModal
        modalUseState={[winnerModal, setWinnerModal]}
        session={session.data}
        winner={winner}
      />

      <PageSubscriptions
        SessionID={cookies.GenAIChessDemoSessionID}
        latestMoveRefetch={latestMove.refetch}
      />
    </div>
  );
};

const PageSubscriptions = ({ SessionID, latestMoveRefetch }) => {
  const client = generateClient();

  useEffect(() => {
    const updateLatestMove = client
      .graphql({ query: onUpdateLatestMove, variables: { SessionID } })
      .subscribe({ next: () => latestMoveRefetch() });

    return () => {
      updateLatestMove.unsubscribe();
    };
  }, []);

  return null;
};
