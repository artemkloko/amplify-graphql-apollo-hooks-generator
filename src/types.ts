import { GQLOperationTypeEnum } from "amplify-graphql-docs-generator/lib/generator";

export enum Language {
  TYPESCRIPT = "typescript",
  JAVASCRIPT = "javascript",
}

export enum ApolloOperation {
  Query = "Query",
  LazyQuery = "LazyQuery",
  Mutation = "Mutation",
  Subscription = "Subscription",
}

export type OperationsForType = {
  gqlOperation: GQLOperationTypeEnum;
  apolloOperation: ApolloOperation;
  operations: {
    hookName: string;
    operationName: string;
    operationType: string;
    variablesType?: string;
  }[];
};

export type RenderOperationsInput = {
  operationsPerType: OperationsForType[];
  imports: Record<string, string[]>;
};
