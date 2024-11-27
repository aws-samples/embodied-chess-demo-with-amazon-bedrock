import { useQuery } from "@tanstack/react-query";
import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
} from "aws-amplify/auth";

// Get User Attributes
export const useUserAttributes = () => {
  return useQuery({
    queryKey: ["userAttributes"],
    queryFn: async () => {
      return await fetchUserAttributes();
    },
  });
};

// Get User Attributes
export const useIsAdmin = () => {
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const adminToken = (await fetchAuthSession()).tokens.idToken.payload[
        "cognito:groups"
      ] as string[];

      if (!adminToken) {
        return false;
      }
      return adminToken.includes("Admin");
    },
  });
};
