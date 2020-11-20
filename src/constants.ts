import { GQLOperationTypeEnum } from "amplify-graphql-docs-generator/lib/generator";

import { ApolloOperation, Language } from "./types";

export const FILE_EXTENSION_MAP: Record<string, string> = {
  [Language.JAVASCRIPT]: "js",
  [Language.TYPESCRIPT]: "ts",
} as const;

export const operationsFilenames = {
  [GQLOperationTypeEnum.QUERY]: "queries",
  [GQLOperationTypeEnum.MUTATION]: "mutations",
  [GQLOperationTypeEnum.SUBSCRIPTION]: "subscriptions",
} as const;

export const apolloOperationsPerGQLOperation = {
  [GQLOperationTypeEnum.QUERY]: [
    ApolloOperation.Query,
    ApolloOperation.LazyQuery,
  ],
  [GQLOperationTypeEnum.MUTATION]: [ApolloOperation.Mutation],
  [GQLOperationTypeEnum.SUBSCRIPTION]: [ApolloOperation.Subscription],
} as const;
