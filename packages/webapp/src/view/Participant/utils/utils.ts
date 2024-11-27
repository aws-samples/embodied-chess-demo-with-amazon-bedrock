import { StatusIndicatorProps } from "@cloudscape-design/components";
import { ConnectionState } from "aws-amplify/api";

export const ConnectionStatusColor = (
  connectionStatus: ConnectionState
): StatusIndicatorProps.Type => {
  switch (connectionStatus) {
    case ConnectionState.Disconnected:
      return "error";
    case ConnectionState.Connecting:
      return "info";
    case ConnectionState.Connected:
      return "success";
    default:
      return "warning";
  }
};

export const GameStatusColor = (
  GameStatus: string
): StatusIndicatorProps.Type => {
  switch (GameStatus) {
    case "ERROR":
      return "warning";
    case "PAUSED":
      return "warning";
    case "PLAYING":
      return "success";
    case "COMPLETED":
      return "success";
    default:
      return "warning";
  }
};
