import { connectionStatusAtom, navHeightPxAtom } from "../../../common/atom";
import { ConnectionStatusColor, GameStatusColor } from "../utils/utils";
import { useIsAdmin, useUserAttributes } from "../../../common/api";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { sessionCookieName } from "../../../common/constant";
import { useEffect, useRef, useState } from "react";
import { useGetSession } from "../api/queries";
import { signOut } from "aws-amplify/auth";
import { useCookies } from "react-cookie";
import { capitalize } from "lodash";
import { useAtom } from "jotai";

import {
  Box,
  Button,
  Modal,
  StatusIndicator,
  TopNavigation,
} from "@cloudscape-design/components";

export const Navigation = () => {
  const [connectionStatus] = useAtom(connectionStatusAtom);
  const [cookies, , remove] = useCookies([sessionCookieName]);

  const navigate = useNavigate();

  const session = useGetSession(cookies.GenAIChessDemoSessionID);
  const userAttributes = useUserAttributes();
  const ref = useRef<HTMLDivElement>(null);
  const isAdmin = useIsAdmin();

  const [switchSession, setSwitchSession] = useState(false);
  const [, setNavHeight] = useAtom(navHeightPxAtom);

  useEffect(() => {
    if (ref.current) setNavHeight(ref.current.clientHeight);
  }, [ref.current]);

  return (
    <div ref={ref}>
      <TopNavigation
        identity={{ title: "Embodied AI Chess with Amazon Bedrock", href: "/" }}
        utilities={
          session.data
            ? [
                {
                  type: "button",
                  text: `Session: ${cookies.GenAIChessDemoSessionID}`,
                  onClick: () => setSwitchSession(true),
                },
                {
                  type: "button",
                  text: (
                    <StatusIndicator
                      type={ConnectionStatusColor(connectionStatus)}
                    >
                      Websocket {connectionStatus}
                    </StatusIndicator>
                  ) as any,
                },
                {
                  type: "button",
                  text: (
                    <StatusIndicator
                      type={GameStatusColor(session.data.GameStatus)}
                    >
                      Game{" "}
                      {session.data.GameStatus === "ERROR"
                        ? "Paused"
                        : capitalize(session.data.GameStatus)}
                    </StatusIndicator>
                  ),
                },
                {
                  type: "menu-dropdown",
                  text: userAttributes.data?.email,
                  iconName: "user-profile",
                  items: isAdmin
                    ? [
                        {
                          text: "Participant Views",
                          items: [
                            {
                              id: "controls",
                              text: "Controls",
                              iconName: "star",
                            },
                            {
                              id: "3d",
                              text: "3D",
                              iconName: "view-full",
                            },
                          ],
                        },
                        {
                          text: "Admin Views",
                          items: [
                            {
                              id: "admin_dash",
                              text: "Dashboard",
                              iconName: "multiscreen",
                            },
                            {
                              id: "leaderboard",
                              text: "Leaderboard",
                              iconName: "gen-ai",
                            },
                            {
                              id: "settings",
                              text: "Settings",
                              iconName: "settings",
                            },
                          ],
                        },
                        { id: "signout", text: "Sign out" },
                      ]
                    : [
                        {
                          text: "Participant Views",
                          items: [
                            {
                              id: "controls",
                              text: "Controls",
                              iconName: "star",
                            },
                            {
                              id: "3d",
                              text: "3D",
                              iconName: "view-full",
                            },
                          ],
                        },
                        { id: "signout", text: "Sign out" },
                      ],
                  onItemClick: ({ detail }) => {
                    navigateSwitch(detail.id, navigate);
                  },
                },
              ]
            : [
                {
                  type: "menu-dropdown",
                  text: userAttributes.data?.email,
                  iconName: "user-profile",
                  items: isAdmin
                    ? [
                        {
                          text: "Admin Views",
                          items: [
                            {
                              id: "admin_dash",
                              text: "Dashboard",
                              iconName: "multiscreen",
                            },
                            {
                              id: "leaderboard",
                              text: "Leaderboard",
                              iconName: "gen-ai",
                            },
                            {
                              id: "settings",
                              text: "Settings",
                              iconName: "settings",
                            },
                          ],
                        },
                        { id: "signout", text: "Sign out" },
                      ]
                    : [{ id: "signout", text: "Sign out" }],
                  onItemClick: ({ detail }) => {
                    navigateSwitch(detail.id, navigate);
                  },
                },
              ]
        }
      />
      <Modal
        onDismiss={() => setSwitchSession(false)}
        visible={switchSession}
        footer={
          <Box float="right">
            <Button
              variant="primary"
              onClick={() => {
                remove("GenAIChessDemoSessionID", {
                  path: "/",
                });
                setSwitchSession(false);
              }}
            >
              Change Session
            </Button>
          </Box>
        }
        header={`Session: ${cookies.GenAIChessDemoSessionID} `}
      >
        Would you like to log out of this session and switch into another?
      </Modal>
    </div>
  );
};

const navigateSwitch = (id: string, navigate: NavigateFunction) => {
  switch (id) {
    case "controls":
      return navigate("/participant/controls");
    case "3d":
      return navigate("/participant");
    case "admin_dash":
      return navigate("/admin");
    case "leaderboard":
      return navigate("/admin/leaderboard");
    case "signout":
      return signOut();
    case "settings":
      return navigate("/admin/settings");
    default:
      break;
  }
};
