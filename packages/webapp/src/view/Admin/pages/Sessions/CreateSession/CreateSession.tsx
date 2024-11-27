import {
  Modal,
  Box,
  SpaceBetween,
  FormField,
  Button,
  Input,
  AlertProps,
  Select,
} from "@cloudscape-design/components";

import { Dispatch, SetStateAction } from "react";
import { useCreateSession } from "../../../api/mutations";
import { Controller, useForm } from "react-hook-form";
import { PlayerConfiguration } from "./PlayerConfiguration";
import { useGetBgSrc } from "../../../api/queries";

interface ICreateSession {
  createUseState: [boolean, Dispatch<SetStateAction<boolean>>];
  alertUseState: [AlertProps, Dispatch<SetStateAction<AlertProps>>];
}

export const CreateSession = (props: ICreateSession) => {
  const {
    createUseState: [createSession, setCreateSession],
    alertUseState: [alertStatus, setAlertStatus],
  } = props;

  const { handleSubmit, control, watch, resetField, reset } = useForm();
  const { mutateAsync, isPending } = useCreateSession();
  const getBgSrc = useGetBgSrc();

  const onSubmit = async (data: any) => {
    const { sessionID, white, black, backgroundSrc } = data;

    try {
      await mutateAsync({
        sessionID,
        white: white.option.value,
        whiteID: white.id?.value ?? white.id,
        black: black.option.value,
        blackID: black.id?.value ?? black.id,
        backgroundSrc: backgroundSrc?.value,
      });
      setAlertStatus({
        ...alertStatus,
        children: (
          <span>
            Session Created: <b>{sessionID}</b>
          </span>
        ),
        type: "success",
      });
      reset();
    } catch (error) {
      console.error(error);
      setAlertStatus({
        ...alertStatus,
        children: JSON.stringify(error),
        type: "error",
      });
    } finally {
      setCreateSession(false);
    }
  };

  return (
    <form id="createSession" onSubmit={handleSubmit(onSubmit)}>
      {createSession && (
        <Modal
          size="large"
          onDismiss={() => setCreateSession(false)}
          visible={createSession}
          footer={
            <Box float="right">
              <Button
                form="createSession"
                variant="primary"
                loading={isPending}
              >
                Create
              </Button>
            </Box>
          }
          header="New Session"
        >
          <SpaceBetween direction="vertical" size="l">
            <Controller
              name="sessionID"
              control={control}
              rules={{
                required: {
                  message: "Required",
                  value: true,
                },
                maxLength: {
                  message: "Maximum length: 128 characters",
                  value: 128,
                },
              }}
              render={({
                field: { onChange, value },
                fieldState: { invalid, error },
              }) => (
                <FormField
                  label="Session ID*"
                  errorText={error?.message}
                  stretch
                >
                  <Input
                    value={value}
                    disabled={isPending}
                    placeholder="Enter a session ID..."
                    onChange={({ detail }) => onChange(detail.value)}
                    invalid={invalid}
                  />
                </FormField>
              )}
            />

            <PlayerConfiguration
              field={"black"}
              isPending={isPending}
              useForm={{ watch, control, resetField }}
            />

            <PlayerConfiguration
              field={"white"}
              isPending={isPending}
              useForm={{ watch, control, resetField }}
            />

            <Controller
              name="backgroundSrc"
              control={control}
              defaultValue={{
                label: getBgSrc.data[0]?.path.slice(12),
                value: getBgSrc.data[0]?.path,
              }}
              render={({ field: { onChange, value } }) => (
                <FormField
                  label="Background"
                  description="Defaults to no background if none selected"
                >
                  <Select
                    selectedOption={value}
                    onChange={({ detail }) => onChange(detail.selectedOption)}
                    options={getBgSrc.data.map((src) => ({
                      label: src.path.slice(12),
                      value: src.path,
                    }))}
                    placeholder="Select background..."
                    empty={"No backgrounds found. Upload some in Settings."}
                  />
                </FormField>
              )}
            />
          </SpaceBetween>
        </Modal>
      )}
    </form>
  );
};
