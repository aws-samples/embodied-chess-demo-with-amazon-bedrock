import {
  FormField,
  Container,
  KeyValuePairs,
  Select,
  Slider,
} from "@cloudscape-design/components";

import {
  useListFoundationModels,
  useListImportedModels,
  useListUsers,
} from "../../../api/queries";

import { gameOptions, transformModelOptions } from "../menuOptions";

import { Controller, UseFormReturn } from "react-hook-form";
import { SessionRecord } from "../../../../../API";
import { capitalize } from "lodash";
import { useEffect } from "react";

interface IPlayerConfiguration {
  field: "black" | "white";
  isPending: boolean;
  editSession: SessionRecord;
  useForm: Partial<UseFormReturn>;
}

export const PlayerConfiguration = (props: IPlayerConfiguration) => {
  const { field, useForm, isPending, editSession } = props;
  const { watch, resetField, control } = useForm;

  const option = watch(`${field}.option`);

  const foundationModels = useListFoundationModels();
  const importedModels = useListImportedModels();
  const listUsers = useListUsers();

  useEffect(() => {
    switch (option?.value) {
      case "player":
        if (listUsers.data?.length) {
          if (editSession[capitalize(field)] === "player") {
            return resetField(`${field}.id`, {
              defaultValue: {
                label: editSession[`${capitalize(field)}ID`],
                value: editSession[`${capitalize(field)}ID`],
              },
            });
          }
          return resetField(`${field}.id`, {
            defaultValue: {
              label: listUsers.data[0],
              value: listUsers.data[0],
            },
          });
        }
        return resetField(`${field}.id`, {
          defaultValue: null,
        });
      case "bedrock":
        if (editSession[capitalize(field)] === "bedrock") {
          const modelRecord = foundationModels.data.find((item) => {
            return item.modelId === editSession[`${capitalize(field)}ID`];
          });
          return resetField(`${field}.id`, {
            defaultValue: {
              label: modelRecord.modelName,
              value: modelRecord.modelId,
            },
          });
        }
        return resetField(`${field}.id`, {
          defaultValue: {
            label: foundationModels.data?.[0].modelName,
            value: foundationModels.data?.[0].modelId,
          },
        });
      case "imported":
        if (importedModels.data?.length) {
          if (editSession[capitalize(field)] === "imported") {
            const modelRecord = importedModels.data.find((item) => {
              return item.modelArn === editSession[`${capitalize(field)}ID`];
            });
            return resetField(`${field}.id`, {
              defaultValue: {
                label: modelRecord.modelName,
                value: modelRecord.modelArn,
              },
            });
          }
          return resetField(`${field}.id`, {
            defaultValue: {
              label: importedModels.data?.[0].modelName,
              value: importedModels.data?.[0].modelArn,
            },
          });
        }
        return resetField(`${field}.id`, {
          defaultValue: null,
        });
      case "chessengine":
        if (editSession[capitalize(field)] === "chessengine") {
          return resetField(`${field}.id`, {
            defaultValue: editSession[`${capitalize(field)}ID`],
          });
        }
        return resetField(`${field}.id`, { defaultValue: 1500 });

      default:
        resetField(`${field}.id`, { defaultValue: "random" });
    }
  }, [option, field, listUsers.isSuccess]);

  return (
    <FormField label={capitalize(field)} stretch>
      <Container>
        <KeyValuePairs
          columns={2}
          items={(() => {
            const gameType = {
              label: null,
              value: (
                <Controller
                  name={`${field}.option`}
                  defaultValue={gameOptions.find(
                    (element) =>
                      element.value === editSession[capitalize(field)]
                  )}
                  control={control}
                  render={({ field: { onChange, value } }) => (
                    <FormField label="Type">
                      <Select
                        disabled={isPending}
                        selectedOption={value}
                        onChange={({ detail }) =>
                          onChange(detail.selectedOption)
                        }
                        options={gameOptions}
                      />
                    </FormField>
                  )}
                />
              ),
            };

            switch (option?.value) {
              case "player":
                return [
                  gameType,
                  {
                    label: null,
                    value: (
                      <Controller
                        name={`${field}.id`}
                        control={control}
                        rules={{
                          required: true,
                        }}
                        render={({ field: { onChange, value } }) => (
                          <FormField label="Username*">
                            <Select
                              disabled={isPending}
                              filteringType="auto"
                              selectedOption={value}
                              onChange={({ detail }) =>
                                onChange(detail.selectedOption)
                              }
                              statusType={
                                foundationModels.isLoading
                                  ? "loading"
                                  : "finished"
                              }
                              options={listUsers.data?.map((user) => {
                                return {
                                  label: user,
                                  value: user,
                                };
                              })}
                              loadingText="Loading users"
                            />
                          </FormField>
                        )}
                      />
                    ),
                  },
                ];
              case "bedrock":
                return [
                  gameType,
                  {
                    label: null,
                    value: (
                      <FormField label={"Model"}>
                        <Controller
                          name={`${field}.id`}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Select
                              disabled={isPending}
                              filteringType="auto"
                              selectedOption={value}
                              onChange={({ detail }) =>
                                onChange(detail.selectedOption)
                              }
                              statusType={
                                foundationModels.isLoading
                                  ? "loading"
                                  : "finished"
                              }
                              options={transformModelOptions(
                                foundationModels.data
                              )}
                              loadingText="Loading models"
                            />
                          )}
                        />
                      </FormField>
                    ),
                  },
                ];
              case "imported":
                return [
                  gameType,
                  {
                    label: null,
                    value: (
                      <FormField label={"Imported Model"}>
                        {importedModels.data?.length ? (
                          <Controller
                            name={`${field}.id`}
                            control={control}
                            render={({ field: { onChange, value } }) => (
                              <Select
                                disabled={isPending}
                                selectedOption={value}
                                onChange={({ detail }) =>
                                  onChange(detail.selectedOption)
                                }
                                statusType={
                                  foundationModels.isLoading
                                    ? "loading"
                                    : "finished"
                                }
                                options={importedModels.data.map(
                                  ({ modelName, modelArn }) => {
                                    return {
                                      label: modelName,
                                      value: modelArn,
                                    };
                                  }
                                )}
                                loadingText="Loading imported models"
                              />
                            )}
                          />
                        ) : (
                          <span>No imported models found</span>
                        )}
                      </FormField>
                    ),
                  },
                ];
              case "chessengine":
                return [
                  gameType,
                  {
                    label: null,
                    value: (
                      <FormField label={"Engine Level (Elo level)"}>
                        <Controller
                          name={`${field}.id`}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Slider
                              disabled={isPending}
                              onChange={({ detail }) => onChange(detail.value)}
                              value={value}
                              max={3000}
                              min={100}
                            />
                          )}
                        />
                      </FormField>
                    ),
                  },
                ];
              default:
                return [gameType];
            }
          })()}
        />
      </Container>
    </FormField>
  );
};
