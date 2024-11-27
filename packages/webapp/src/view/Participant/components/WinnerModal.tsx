import {
  Modal,
  Box,
  Button,
  Header,
  SpaceBetween,
  StatusIndicator,
} from "@cloudscape-design/components";
import { Dispatch, SetStateAction } from "react";
import { SessionRecord } from "../../../API";
import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  div[class*='awsui_content_'] {
    background-color: #040724 !important;
  }
`;

interface IWinnerModal {
  modalUseState: [boolean, Dispatch<SetStateAction<boolean>>];
  session: SessionRecord;
  winner: string;
}

export const WinnerModal = (props: IWinnerModal) => {
  const {
    modalUseState: [winnerModal, setWinnerModal],
    session,
    winner,
  } = props;

  return (
    <Modal
      onDismiss={() => setWinnerModal(false)}
      visible={winnerModal}
      footer={
        <Box float="right">
          <Button variant="primary" onClick={() => setWinnerModal(false)}>
            {winner === "Draw" ? "Okay..." : "Woohoo!"}
          </Button>
        </Box>
      }
      header={
        <Header>
          {winner === "Draw"
            ? "😐 The Game has Ended in a Draw 🤨"
            : "🎉 Winner Winner Chicken Dinner 🎉"}
        </Header>
      }
      size="large"
    >
      <GlobalStyle />
      <Box textAlign="center" padding={"l"}>
        {winner === "Draw" ? (
          <img src={"/gifs/bombasticSideEye.gif"} />
        ) : (
          <SpaceBetween size={"m"}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img src={"/gifs/winner.gif"} />
            </div>

            <Box>
              {winner ? (
                <>
                  <p>{session[`${winner}ID`]}</p>
                  <StatusIndicator type="success" children={winner} />
                </>
              ) : (
                <StatusIndicator type="warning" children={"Draw"} />
              )}
            </Box>
          </SpaceBetween>
        )}
      </Box>
    </Modal>
  );
};
