import { useGetLatestMove, useGetSession } from "./api/queries";
import { applyMode, Mode } from "@cloudscape-design/global-styles";
import { Alert, Box, Spinner } from "@cloudscape-design/components";
import { SearchSessionID } from "./components/SearchSessionID";
import { Navigation } from "./navigation/Navigation";
import { navHeightPxAtom } from "../../common/atom";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import mime from "mime";
import { StorageImage } from "@aws-amplify/ui-react-storage";
import { getUrl } from "aws-amplify/storage";

export const ParticipantSetup = () => {
  const [navHeight] = useAtom(navHeightPxAtom);

  useEffect(() => {
    applyMode(Mode.Dark);
  }, []);

  return (
    <>
      <Navigation />

      <SearchSessionID>
        {(sessionId) => (
          <>
            <div style={{ height: `calc(100vh - ${navHeight}px)` }}>
              <PlayerOutlet sessionId={sessionId} />
            </div>
          </>
        )}
      </SearchSessionID>
    </>
  );
};

export const PlayerOutlet = ({ sessionId }) => {
  const [navHeight] = useAtom(navHeightPxAtom);

  const latestMove = useGetLatestMove(sessionId);
  const session = useGetSession(sessionId);

  // If session was to change, get moves
  useEffect(() => {
    latestMove.refetch();
  }, [session.data]);

  return session.isLoading || latestMove.isLoading ? (
    <div
      style={{
        transform: "translate(-50%, -50%)",
        position: "absolute",
        left: "50%",
        top: "50%",
      }}
    >
      <Spinner size="large" />
    </div>
  ) : latestMove.data && session.data ? (
    <>
      <BackgroundSrc session={session.data} />
      <Outlet />
    </>
  ) : (
    <Box padding={"l"}>
      <Alert type="error">
        <div
          style={{
            height: `calc(95vh - ${navHeight}px)`,
            overflowY: "scroll",
          }}
        >
          <pre>latestMove: {JSON.stringify(session.data, null, 2)}</pre>
          <pre>latestMove: {JSON.stringify(latestMove.data, null, 2)}</pre>
          <b>Error: latestMove or moves should not be null</b>
        </div>
      </Alert>
    </Box>
  );
};

export const BackgroundSrc = ({ session }) => {
  const [src, setSrc] = useState(null);

  if (!session.BackgroundSrc) {
    return null;
  }

  useEffect(() => {
    if (mime.getType(session.BackgroundSrc).startsWith("video/")) {
      (async () => {
        const { url } = await getUrl({ path: session.BackgroundSrc });

        setSrc(url.toString());
      })();
    }
  }, []);

  if (mime.getType(session.BackgroundSrc).startsWith("image/")) {
    return (
      <StorageImage
        style={{
          zIndex: -1,
          position: "absolute",
          minWidth: "100%",
          minHeight: "100%",
        }}
        alt={session.BackgroundSrc}
        path={session.BackgroundSrc}
      />
    );
  }

  if (mime.getType(session.BackgroundSrc).startsWith("video/")) {
    return (
      <video
        src={src}
        style={{
          zIndex: -1,
          position: "absolute",
          minWidth: "100%",
          minHeight: "100%",
        }}
        autoPlay
        muted
        loop
      />
    );
  }

  return null;
};
