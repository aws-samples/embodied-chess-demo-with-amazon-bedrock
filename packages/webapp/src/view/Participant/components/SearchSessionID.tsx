import {
  Box,
  Button,
  SpaceBetween,
  FormField,
  Input,
  Alert,
  Modal,
  Spinner,
  AlertProps,
} from "@cloudscape-design/components";

import {
  onDeleteSession,
  onUpdateGameStatus,
  onUpdateSession,
} from "../../../graphql/subscriptions";

import { sessionCookieName } from "../../../common/constant";
import { Controller, useForm } from "react-hook-form";
import { useVerifySession } from "../api/mutations";
import { generateClient } from "aws-amplify/api";
import { useGetSession } from "../api/queries";
import { useEffect, useState } from "react";
import { useCookies } from "react-cookie";

export const SearchSessionID = ({ children }): JSX.Element | null => {
  const verifySession = useVerifySession();

  const [cookie, setCookie, remove] = useCookies([sessionCookieName]);
  const [endSession, setEndSession] = useState(false);

  const session = useGetSession(cookie.GenAIChessDemoSessionID);

  const [alertStatus, setAlertStatus] = useState<AlertProps>({});

  const { control, handleSubmit } = useForm();

  const [sessionEndedModal, setSessionEndedModel] = useState(true);
  const [newSessionModal, setNewSessionModal] = useState(true);

  if (cookie.GenAIChessDemoSessionID) {
    return session.isLoading ? (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner size="large" />
      </div>
    ) : !session.data || endSession ? (
      <Modal
        visible={sessionEndedModal}
        onDismiss={() => setSessionEndedModel(false)}
        footer={
          <Box float="right">
            <Button
              variant="primary"
              onClick={() => {
                remove("GenAIChessDemoSessionID", {
                  path: "/",
                });
              }}
            >
              Change Session
            </Button>
          </Box>
        }
        header={`Session Ended: ${cookie.GenAIChessDemoSessionID} `}
      >
        Session <b>{cookie.GenAIChessDemoSessionID}</b> been terminated. Click
        below to switch into a new session.
      </Modal>
    ) : (
      <>
        {children(cookie.GenAIChessDemoSessionID)}
        <PageSubscriptions
          SessionID={cookie.GenAIChessDemoSessionID}
          setEndSession={setEndSession}
          refetch={session.refetch}
        />
      </>
    );
  }

  const onSubmit = async (data) => {
    const { SessionID } = data;

    try {
      await verifySession.mutateAsync({ SessionID });
      setCookie("GenAIChessDemoSessionID", SessionID, {
        path: "/",
      });
    } catch (error) {
      console.error(error);
      setAlertStatus({
        children: <pre>{JSON.stringify(error.errors, null, 2)}</pre>,
        type: "error",
      });
    }
  };

  return (
    <form id="verifySession" onSubmit={handleSubmit(onSubmit)}>
      <Modal
        visible={newSessionModal}
        onDismiss={() => setNewSessionModal(false)}
        footer={
          <Box float="right">
            <Button
              variant="primary"
              form="verifySession"
              loading={verifySession.isPending}
            >
              Verify Session
            </Button>
          </Box>
        }
        header={"Join a Game!!!"}
      >
        <SpaceBetween size="m">
          {alertStatus.children && <Alert {...alertStatus}></Alert>}

          <Controller
            name="SessionID"
            control={control}
            rules={{
              required: {
                message: "Required",
                value: true,
              },
            }}
            render={({
              field: { onChange, value },
              fieldState: { invalid, error },
            }) => (
              <FormField
                label="Session ID"
                description="Enter the session ID of the chess game you'd like to join"
                errorText={error?.message}
              >
                <Input
                  value={value}
                  disabled={verifySession.isPending}
                  onChange={({ detail }) => onChange(detail.value)}
                  invalid={invalid}
                  onKeyDown={({ detail }) => {
                    if (detail.keyCode === 13) {
                      handleSubmit(onSubmit)();
                    }
                  }}
                />
              </FormField>
            )}
          />
        </SpaceBetween>
      </Modal>
    </form>
  );
};

const PageSubscriptions = ({ SessionID, refetch, setEndSession }) => {
  const client = generateClient();

  useEffect(() => {
    const updateGameStatus = client
      .graphql({ query: onUpdateGameStatus, variables: { SessionID } })
      .subscribe({ next: () => refetch() });

    const updateSession = client
      .graphql({ query: onUpdateSession, variables: { SessionID } })
      .subscribe({ next: () => refetch() });

    const deleteSession = client
      .graphql({ query: onDeleteSession, variables: { SessionID } })
      .subscribe({ next: () => setEndSession(true) });

    return () => {
      updateGameStatus.unsubscribe();
      updateSession.unsubscribe();
      deleteSession.unsubscribe();
    };
  }, []);

  return null;
};
