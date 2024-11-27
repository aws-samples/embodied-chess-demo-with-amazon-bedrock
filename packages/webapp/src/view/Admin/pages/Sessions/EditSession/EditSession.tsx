import {
  Modal,
  Box,
  SpaceBetween,
  FormField,
  Button,
  AlertProps,
} from "@cloudscape-design/components";

import { PlayerConfiguration } from "./PlayerConfiguration";
import { useUpdateSession } from "../../../api/mutations";
import { SessionRecord } from "../../../../../API";
import { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";

interface IEditSession {
  alertUseState: [AlertProps, Dispatch<SetStateAction<AlertProps>>];
  editUseState: [SessionRecord, Dispatch<SetStateAction<SessionRecord>>];
}

export const EditSession = (props: IEditSession) => {
  const {
    editUseState: [editSession, setEditSession],
    alertUseState: [alertStatus, setAlertStatus],
  } = props;

  const { handleSubmit, control, watch, resetField } = useForm();
  const { mutateAsync, isPending } = useUpdateSession();

  const onSubmit = async (data) => {
    const { white, black } = data;

    try {
      await mutateAsync({
        sessionID: editSession.SessionID,
        white: white.option,
        whiteID: white.id?.value ?? white.id,
        black: black.option,
        blackID: black.id?.value ?? black.id,
      });
      setAlertStatus({
        ...alertStatus,
        children: (
          <span>
            Session Updated: <b>{editSession.SessionID}</b>
          </span>
        ),
        type: "success",
      });
    } catch (error) {
      console.error(error);
      setAlertStatus({
        ...alertStatus,
        children: JSON.stringify(error),
        type: "error",
      });
    } finally {
      setEditSession(null);
    }
  };

  return (
    <form id="editSession" onSubmit={handleSubmit(onSubmit)}>
      <Modal
        onDismiss={() => setEditSession(null)}
        visible={!!editSession}
        footer={
          <Box float="right">
            <Button loading={isPending} form="editSession">
              Update
            </Button>
          </Box>
        }
        header="Session Editor"
      >
        <SpaceBetween direction="vertical" size="l">
          <FormField label="Session ID">{editSession.SessionID}</FormField>

          <PlayerConfiguration
            field={"black"}
            isPending={isPending}
            editSession={editSession}
            useForm={{ watch, control, resetField }}
          />

          <PlayerConfiguration
            field={"white"}
            isPending={isPending}
            editSession={editSession}
            useForm={{ watch, control, resetField }}
          />
        </SpaceBetween>
      </Modal>
    </form>
  );
};
