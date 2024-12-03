import {
  useListFoundationModels,
  useListImportedModels,
  useListUsers,
} from "../../../api/queries";

import { gameOptions, transformModelOptions } from "../menuOptions";

import {
  Container,
  FormField,
  KeyValuePairs,
  Select,
  Slider,
} from "@cloudscape-design/components";

import { Controller, UseFormReturn } from "react-hook-form";
import { capitalize } from "lodash";
import { useEffect } from "react";

interface IPlayerConfiguration {
  field: "black" | "white";
  isPending: boolean;
  useForm: Partial<UseFormReturn>;
}

export const PlayerConfiguration = (props: IPlayerConfiguration) => {
  const { field, isPending, useForm } = props;

  const { watch, resetField, control } = useForm;

  const option = watch(`${field}.option`, gameOptions[0].value);

  const foundationModels = useListFoundationModels();
  const importedModels = useListImportedModels();
  const listUsers = useListUsers();

  useEffect(() => {
    switch (option?.value) {
      case "player":
        if (listUsers.data?.length) {
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
        return resetField(`${field}.id`, {
          defaultValue: {
            label: foundationModels.data?.[0].modelName,
            value: foundationModels.data?.[0].modelId,
          },
        });
      case "imported":
        if (importedModels.data?.length) {
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
        return resetField(`${field}.id`, { defaultValue: 1500 });
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
                  defaultValue={gameOptions[0]}
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
                          required: {
                            message: "Required",
                            value: true,
                          },
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
                              loadingText="Loading foundation models"
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
                                  importedModels.isLoading
                                    ? "loading"
                                    : "finished"
                                }
                                options={importedModels.data?.map(
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
