import {
  Alert,
  Box,
  Button,
  ContentLayout,
  Header,
  Icon,
  SpaceBetween,
  Table,
  ButtonDropdown,
  StatusIndicator,
  Popover,
  AlertProps,
  TableProps,
} from "@cloudscape-design/components";

import {
  onCreateSession,
  onDeleteSession,
  onUpdateGameStatus,
  onUpdateSession,
} from "../../../graphql/subscriptions";

import { CreateSession } from "./Sessions/CreateSession/CreateSession";
import { EditSession } from "./Sessions/EditSession/EditSession";
import { DeleteSession } from "./Sessions/DeleteSession";
import { useListActiveSessions } from "../api/queries";
import { useUpdateGameStatus } from "../api/mutations";
import { generateClient } from "aws-amplify/api";
import { SessionRecord } from "../../../API";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { sessionCookieName } from "../../../common/constant";

export const AdminHomePage = () => {
  const sessions = useListActiveSessions();

  const { mutateAsync } = useUpdateGameStatus();

  const [, setCookie] = useCookies([sessionCookieName]);

  const [createSession, setCreateSession] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    TableProps.SelectionChangeDetail<SessionRecord>["selectedItems"]
  >([]);
  const [editSession, setEditSession] = useState<SessionRecord>();
  const [delSession, setDelSession] = useState(false);

  const [alertStatus, setAlertStatus] = useState<AlertProps>({
    dismissible: true,
    onDismiss: () => {
      setAlertStatus({ ...alertStatus, children: "" });
    },
  });

  const updateGameStatus = async ({ GameStatus, SessionID }: SessionRecord) => {
    if (GameStatus !== "COMPLETED") {
      if (GameStatus === "PLAYING") {
        await mutateAsync({
          SessionID,
          GameStatus: "PAUSED",
        });
      } else {
        await mutateAsync({
          SessionID,
          GameStatus: "PLAYING",
        });
      }
    }
  };

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Begin by selecting a Session ID, then proceed to participant views"
        >
          Administrator Dashboard
        </Header>
      }
      defaultPadding
    >
      <SpaceBetween size="m">
        {alertStatus.children && <Alert {...alertStatus} />}

        <Table
          contentDensity="compact"
          loadingText="Retrieving Sessions"
          selectedItems={selectedItems}
          loading={sessions.isLoading}
          selectionType="single"
          onSelectionChange={({ detail }) =>
            setSelectedItems(detail.selectedItems)
          }
          header={
            <Header
              variant="h3"
              description="Create, delete or modify sessions"
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    variant="primary"
                    onClick={() => setCreateSession(true)}
                  >
                    Create
                  </Button>
                  <Button
                    disabled={!!!selectedItems.length}
                    onClick={() => setDelSession(true)}
                  >
                    Delete
                  </Button>
                  <Button
                    disabled={sessions.isLoading}
                    loading={sessions.isRefetching}
                    onClick={() => sessions.refetch()}
                    iconName="refresh"
                  />
                </SpaceBetween>
              }
            >
              Active Sessions
            </Header>
          }
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
              header: "White",
              cell: ({ WhiteID }) => WhiteID,
            },
            {
              header: "Black",
              cell: ({ BlackID }) => BlackID,
            },
            {
              header: (
                <Box textAlign="center">
                  <Icon name="status-info" />
                </Box>
              ),
              width: 60,
              cell: (item) => {
                switch (item.GameStatus) {
                  case "ERROR":
                    return (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Popover
                          content={`${item.Error}\n${item.Cause}`}
                          size="large"
                        >
                          <StatusIndicator type="error">Error</StatusIndicator>
                        </Popover>
                      </div>
                    );
                  case "PLAYING":
                    return (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <StatusIndicator type="in-progress">
                          In progress
                        </StatusIndicator>
                      </div>
                    );
                  case "PAUSED":
                    return (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <StatusIndicator type="stopped">
                          Stopped
                        </StatusIndicator>
                      </div>
                    );
                  case "COMPLETED":
                    return (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <StatusIndicator>Completed</StatusIndicator>
                      </div>
                    );
                  default:
                    return (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <StatusIndicator type="warning">
                          Warning
                        </StatusIndicator>
                      </div>
                    );
                }
              },
            },
            {
              header: (
                <Box textAlign="center">
                  <Icon name="settings" />
                </Box>
              ),
              width: 40,
              cell: (item) => {
                return (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <ButtonDropdown
                      disabled={item.GameStatus === "COMPLETED"}
                      variant="normal"
                      expandToViewport
                      items={[
                        {
                          text: "Start",
                          iconName: "play",
                          id: "start",
                          disabled: item.GameStatus === "PLAYING",
                        },
                        {
                          text: "Stop",
                          id: "stop",
                          iconName: "pause",
                          disabled: item.GameStatus !== "PLAYING",
                        },
                        {
                          text: "Edit",
                          id: "edit",
                          iconName: "edit",
                          disabled: item.GameStatus !== "PAUSED",
                        },
                      ]}
                      onItemClick={({ detail }) => {
                        if (["start", "stop"].includes(detail.id)) {
                          return updateGameStatus(item);
                        }
                        switch (detail.id) {
                          case "edit":
                            return setEditSession(item);
                          default:
                            break;
                        }
                      }}
                    />
                  </div>
                );
              },
            },
          ]}
          empty={
            <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
              <b>No active sessions</b>
            </Box>
          }
          items={sessions.data?.items ?? []}
        />
      </SpaceBetween>

      <CreateSession
        createUseState={[createSession, setCreateSession]}
        alertUseState={[alertStatus, setAlertStatus]}
      />

      {editSession && (
        <EditSession
          alertUseState={[alertStatus, setAlertStatus]}
          editUseState={[editSession, setEditSession]}
        />
      )}

      <DeleteSession
        alertUseState={[alertStatus, setAlertStatus]}
        delUseState={[delSession, setDelSession]}
        selectedItem={selectedItems[0]}
      />

      <PageSubscriptions refetch={sessions.refetch} />
    </ContentLayout>
  );
};

const PageSubscriptions = ({ refetch }) => {
  const client = generateClient();

  useEffect(() => {
    const createSession = client
      .graphql({ query: onCreateSession })
      .subscribe({ next: () => refetch() });

    const updateSession = client
      .graphql({ query: onUpdateSession })
      .subscribe({ next: () => refetch() });

    const updateGameStatus = client
      .graphql({ query: onUpdateGameStatus })
      .subscribe({ next: () => refetch() });

    const deleteSession = client
      .graphql({ query: onDeleteSession })
      .subscribe({ next: () => refetch() });

    return () => {
      createSession.unsubscribe();
      updateSession.unsubscribe();
      updateGameStatus.unsubscribe();
      deleteSession.unsubscribe();
    };
  }, []);

  return null;
};
