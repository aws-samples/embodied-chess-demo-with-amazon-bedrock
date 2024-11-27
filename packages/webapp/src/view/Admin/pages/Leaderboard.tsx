import {
  Alert,
  AlertProps,
  Box,
  Button,
  ContentLayout,
  Header,
  SpaceBetween,
  StatusIndicator,
  Table,
} from "@cloudscape-design/components";

import { useGamesByMoveCount, useListActiveSessions } from "../api/queries";
import { sessionCookieName } from "../../../common/constant";
import { SessionRecord } from "../../../API";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { Chess } from "chess.js";
import { keyBy } from "lodash";

export const Leaderboard = () => {
  const sessions = useListActiveSessions();
  const gamesByMoveCount = useGamesByMoveCount();
  const [, setCookie] = useCookies([sessionCookieName]);

  const [alertStatus, setAlertStatus] = useState<AlertProps>({
    dismissible: true,
    onDismiss: () => {
      setAlertStatus({ ...alertStatus, children: "" });
    },
  });

  const [sessionGrouping, setSessionGrouping] = useState<{
    [key: string]: SessionRecord;
  }>({});

  useEffect(() => {
    setSessionGrouping(keyBy(sessions.data?.items, "SessionID"));
  }, [sessions.data]);

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Games ranked by number of moves (current & completed)"
        >
          Leaderboard
        </Header>
      }
      defaultPadding
    >
      <SpaceBetween size="m">
        {alertStatus.children && <Alert {...alertStatus} />}

        <Table
          variant="embedded"
          contentDensity="compact"
          loadingText="Retrieving Sessions"
          loading={gamesByMoveCount.isLoading || sessions.isLoading}
          columnDefinitions={[
            {
              header: "Session ID",
              cell: ({ SessionID }) => (
                <Button
                  variant="link"
                  onClick={() => {
                    setCookie("GenAIChessDemoSessionID", SessionID, {
                      path: "/",
                    });
                    setAlertStatus({
                      ...alertStatus,
                      children: (
                        <span>
                          Loaded Session ID: <b>{SessionID}</b>
                        </span>
                      ),
                      type: "info",
                    });
                  }}
                >
                  {SessionID}
                </Button>
              ),
            },
            {
              header: "# of Full Moves",
              cell: ({ Move }) => new Chess(Move).moveNumber(),
            },
            {
              header: "Game Winner",
              cell: (item) => {
                console.log(item);

                switch (item.GameWinner) {
                  case "w":
                    return (
                      <StatusIndicator
                        type="success"
                        children={sessionGrouping[item.SessionID]?.WhiteID}
                      />
                    );
                  case "b":
                    return (
                      <StatusIndicator
                        type="success"
                        children={sessionGrouping[item.SessionID]?.BlackID}
                      />
                    );
                  case "Draw":
                    return <StatusIndicator type="warning" children={"Draw"} />;
                  default:
                    return (
                      <StatusIndicator type="in-progress">
                        In progress
                      </StatusIndicator>
                    );
                }
              },
            },
          ]}
          empty={
            <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
              <b>No Sessions Detected</b>
            </Box>
          }
          items={gamesByMoveCount.data ?? []}
        />
      </SpaceBetween>
    </ContentLayout>
  );
};
