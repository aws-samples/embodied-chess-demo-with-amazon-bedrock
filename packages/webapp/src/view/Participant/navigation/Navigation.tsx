import { connectionStatusAtom, navHeightPxAtom } from "../../../common/atom";
import { useIsAdmin, useUserAttributes } from "../../../common/api";
import { StatusIndicator, TopNavigation } from "@cloudscape-design/components";
import { sessionCookieName } from "../../../common/constant";
import { ConnectionStatusColor, GameStatusColor } from "../utils/utils";
import { useGetSession } from "../api/queries";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { signOut } from "aws-amplify/auth";
import { useCookies } from "react-cookie";
import { useEffect, useRef } from "react";
import { capitalize } from "lodash";
import { useAtom } from "jotai";

export const Navigation = () => {
  const [connectionStatus] = useAtom(connectionStatusAtom);
  const [cookies] = useCookies([sessionCookieName]);
  const navigate = useNavigate();

  const session = useGetSession(cookies.GenAIChessDemoSessionID);
  const userAttributes = useUserAttributes();
  const ref = useRef<HTMLDivElement>(null);
  const isAdmin = useIsAdmin();

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
