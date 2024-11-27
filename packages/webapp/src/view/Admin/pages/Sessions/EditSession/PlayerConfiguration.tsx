import {
  FormField,
  Container,
  KeyValuePairs,
  Select,
  Input,
} from "@cloudscape-design/components";

import {
  useListFoundationModels,
  useListImportedModels,
} from "../../../api/queries";

import {
  chessEngineOptions,
  gameOptions,
  transformModelOptions,
} from "../menuOptions";

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

  useEffect(() => {
    switch (option?.value) {
      case "player":
        if (editSession[capitalize(field)] === "player") {
          return resetField(`${field}.id`, {
            defaultValue: editSession[`${capitalize(field)}ID`],
          });
        }
        return resetField(`${field}.id`, { defaultValue: "" });
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
            defaultValue: chessEngineOptions.find(
              (item) => item.value === editSession[`${capitalize(field)}ID`]
            ),
          });
        }
        return resetField(`${field}.id`, {
          defaultValue: chessEngineOptions[0],
        });
      default:
        resetField(`${field}.id`, { defaultValue: "random" });
    }
  }, [option, field]);

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
                        render={({
                          field: { onChange, value },
                          fieldState: { invalid },
                        }) => (
                          <FormField
                            label="Username*"
                            errorText={invalid && "Required"}
                          >
                            <Input
                              disabled={isPending}
                              value={value}
                              placeholder="Player email..."
                              onChange={({ detail }) => onChange(detail.value)}
                              invalid={invalid}
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
                      <FormField label={"Engine Level"}>
                        <Controller
                          name={`${field}.id`}
                          control={control}
                          render={({ field: { onChange, value } }) => (
                            <Select
                              selectedOption={value}
                              onChange={({ detail }) =>
                                onChange(detail.selectedOption)
                              }
                              options={chessEngineOptions}
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
