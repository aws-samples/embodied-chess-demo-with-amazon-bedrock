import { FoundationModelSummary } from "@aws-sdk/client-bedrock";
import { groupBy } from "lodash";

export const gameOptions = [
  { label: "Player", value: "player" },
  { label: "Bedrock (Base Models)", value: "bedrock" },
  { label: "Bedrock (Imported Models)", value: "imported" },
  { label: "Chess Engine", value: "chessengine" },
  { label: "Random", value: "random" },
];

export const transformModelOptions = (data: FoundationModelSummary[]) => {
  const grouped = groupBy(data, "providerName");

  const modelList = Object.entries(grouped).map(([providerName, models]) => ({
    label: providerName,
    options: models.map((model) => ({
      label: model.modelName,
      value: model.modelId,
    })),
  }));

  return modelList;
};
