# amplify-graphql-apollo-hooks-generator

Generate boilerplate React Apollo hooks for queries, mutations and subscriptions for the provided introspection schema.

---

The generated hooks are just basic wrappers for Apollo hooks provided by `@apollo/client` and they do not offer any extra capabilities from what the Apollo hooks offer.

The only gain of using this plugin is to not waste time on creating and updating those hooks manually after schema changes. And it's especially usefull while bootstraping a new project.

---

Some examples of generated hooks

```typescript
export const useGetUserQuery = (
  options?: QueryHookOptions<GetUserQuery, GetUserQueryVariables>
) => useQuery<GetUserQuery, GetUserQueryVariables>(gql(getUser), options);

export const useGetUserLazyQuery = (
  options?: LazyQueryHookOptions<GetUserQuery, GetUserQueryVariables>
) => useLazyQuery<GetUserQuery, GetUserQueryVariables>(gql(getUser), options);
```

```typescript
export const useCreateUserMutation = (
  options?: MutationHookOptions<CreateUserMutation, CreateUserMutationVariables>
) => useMutation<CreateUserMutation, CreateUserMutationVariables>(gql(createUser), options);
```

```typescript
export const useOnCreateUserSubscription = (
  options?: SubscriptionHookOptions<OnCreateUserSubscription>
) => useSubscription<OnCreateUserSubscription>(gql(onCreateUser), options);
```

The generated hooks are utilizing the following Apollo hooks

```
queries: { useQuery, useLazyQuery} from "@apollo/client"
mutations: { useMutation } from "@apollo/client"
subscriptions: { useSubscription } from "@apollo/client"
```

## Setup

Install the plugin globally and add it to Amplify cli

```sh
yarn global add amplify-graphql-apollo-hooks-generator
amplify plugin add amplify-graphql-apollo-hooks-generator
```

Add `apolloHooksPath` to `.graphqlconfig.yml` of your Amplify project

```yml
projects:
  chat:
    schemaPath: amplify/backend/api/chat/build/schema.graphql
    includes:
      - src/graphql/statements/*.ts
    excludes:
      - amplify/**
    extensions:
      amplify:
        maxDepth: 2
        codeGenTarget: typescript
        generatedFileName: src/@types/graphql.ts
        docsFilePath: src/graphql/statements
        apolloHooksPath: src/graphql/hooks
extensions:
  amplify:
    version: 3
```

Add `@apollo/client` and `graphql-tag` as dependencies in your project, as the generated hooks utilize those

```sh
yarn add @apollo/client graphql-tag
```

## Usage

After pushing the API and generating the GraphQL statements and types - run `amplify apollo-hooks generate` to generate the React Apollo hooks

```sh
amplify push api
amplify codegen
amplify apollo-hooks generate
```

Check out your `apolloHooksPath` for the results
