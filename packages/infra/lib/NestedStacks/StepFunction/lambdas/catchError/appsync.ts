import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_URL;
const endpoint = new URL(GRAPHQL_ENDPOINT!);

const signer = new SignatureV4({
  region: process.env.AWS_REGION,
  credentials: defaultProvider(),
  service: "appsync",
  sha256: Sha256,
});

export const sendRequest = async (query, variables) => {
  const requestToBeSigned = new HttpRequest({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      host: endpoint.host,
    },
    hostname: endpoint.host,
    body: JSON.stringify({ query, variables }),
    path: endpoint.pathname,
  });

  const signed = await signer.sign(requestToBeSigned);
  const request = new Request(GRAPHQL_ENDPOINT!, signed);

  const response = await fetch(request);
  const body = await response.json();
  if (body.errors) {
    throw new Error(JSON.stringify(body.errors));
  }
};
