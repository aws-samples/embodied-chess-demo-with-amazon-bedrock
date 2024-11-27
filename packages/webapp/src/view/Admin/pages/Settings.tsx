import {
  Header,
  ContentLayout,
  Cards,
  Container,
  Button,
} from "@cloudscape-design/components";
import { FileUploader, StorageImage } from "@aws-amplify/ui-react-storage";
import { useGetBgSrc } from "../api/queries";
import mime from "mime";
import { getUrl } from "aws-amplify/storage";
import { useEffect, useState } from "react";
import { useDelBgSrcs } from "../api/mutations";

export const Settings = () => {
  const getBgSrc = useGetBgSrc();
  const delBgSrcs = useDelBgSrcs();

  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  return (
    <ContentLayout
      header={
        <Header
          description={"Configure global settings of the application here"}
        >
          App Settings
        </Header>
      }
      defaultPadding
    >
      <Container
        header={
          <Header
            description="Select custom backgrounds for your games by uploading them here, before creating a session"
            actions={
              <Button
                loading={delBgSrcs.isPending}
                disabled={!selectedItems.length}
                onClick={async () => {
                  await delBgSrcs.mutateAsync({
                    paths: selectedItems.map((item) => item.path),
                  });
                  getBgSrc.refetch();
                  setSelectedItems([]);
                }}
              >
                Delete
              </Button>
            }
          >
            Participant Background
          </Header>
        }
      >
        <Cards
          onSelectionChange={({ detail }) =>
            setSelectedItems(detail?.selectedItems)
          }
          selectedItems={selectedItems}
          selectionType="multi"
          cardDefinition={{
            header: (item) => item.path,
            sections: [
              {
                id: "src",
                content: (item) => {
                  if (mime.getType(item.path).startsWith("image/")) {
                    return <StorageImage alt={item.path} path={item.path} />;
                  } else if (mime.getType(item.path).startsWith("video/")) {
                    return <RenderVideo path={item.path} />;
                  }
                },
              },
            ],
          }}
          items={getBgSrc.data}
        />

        <FileUploader
          acceptedFileTypes={["image/*", "video/*"]}
          path="backgrounds/"
          maxFileCount={5}
          isResumable
          onUploadSuccess={() => getBgSrc.refetch()}
        />
      </Container>
    </ContentLayout>
  );
};

const RenderVideo = ({ path }) => {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    (async () => {
      const { url } = await getUrl({ path });

      setSrc(url.toString());
    })();
  }, []);

  return (
    <video
      src={src}
      style={{
        width: "100%",
      }}
    />
  );
};
