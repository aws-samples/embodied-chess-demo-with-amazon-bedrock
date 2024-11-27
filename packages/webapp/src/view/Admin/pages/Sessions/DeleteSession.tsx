import {
  AlertProps,
  Box,
  Button,
  Modal,
  SpaceBetween,
} from "@cloudscape-design/components";

import { useDeleteSession } from "../../api/mutations";
import { Dispatch, SetStateAction } from "react";
import { SessionRecord } from "../../../../API";

interface IDeleteSession {
  alertUseState: [AlertProps, Dispatch<SetStateAction<AlertProps>>];
  delUseState: [boolean, Dispatch<SetStateAction<boolean>>];
  selectedItem: SessionRecord;
}

export const DeleteSession = (props: IDeleteSession) => {
  const {
    delUseState: [delSession, setDelSession],
    selectedItem,
    alertUseState: [alertStatus, setAlertStatus],
  } = props;

  const { mutateAsync, isPending } = useDeleteSession();

  const submitDelSession = async () => {
    try {
      await mutateAsync({ sessionID: selectedItem.SessionID });

      setAlertStatus({
        ...alertStatus,
        children: (
          <span>
            Session Deleted: <b>{selectedItem.SessionID}</b>
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
      setDelSession(false);
    }
  };

  return (
    <Modal
      onDismiss={() => setDelSession(false)}
      visible={delSession}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              disabled={isPending}
              variant="link"
              onClick={() => setDelSession(false)}
            >
              Cancel
            </Button>
            <Button
              loading={isPending}
              variant="primary"
              onClick={submitDelSession}
            >
              Confirm
            </Button>
          </SpaceBetween>
        </Box>
      }
      header="Delete Session"
    >
      Are you sure you want to delete session <b>{selectedItem?.SessionID}</b>?
    </Modal>
  );
};
