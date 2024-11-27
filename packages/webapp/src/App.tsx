import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useIsAdmin, useUserAttributes } from "./common/api";
import { Spinner } from "@cloudscape-design/components";
import { connectionStatusAtom } from "./common/atom";
import { Hub } from "aws-amplify/utils";
import { useEffect } from "react";
import { useAtom } from "jotai";

export const App = () => {
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const userAttributes = useUserAttributes();

  const { pathname } = useLocation();

  const [, setConnectionStatus] = useAtom(connectionStatusAtom);

  Hub.listen("api", (data: any) => {
    const { payload } = data;
    if (payload.event === "ConnectionStateChange") {
      const connectionState = payload.data.connectionState;
      setConnectionStatus(connectionState);
    }
  });

  useEffect(() => {
    if (pathname === "/" && !isAdmin.isLoading) {
      isAdmin.data ? navigate("/admin") : navigate("/participant");
    }
  }, [isAdmin.isLoading]);

  useEffect(() => {
    pathname.split("/")[1] === "participant"
      ? (document.body.style.overflow = "hidden")
      : (document.body.style.overflow = "auto");
  }, [pathname]);

  return userAttributes.isLoading || isAdmin.isLoading ? (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spinner size="large" />
    </div>
  ) : (
    <Outlet />
  );
};
