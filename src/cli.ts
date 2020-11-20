import * as yargs from "yargs";
import * as path from "path";

import { logError } from "amplify-graphql-docs-generator/lib/logger";

import { generate } from "./generator";
import { Language } from "./types";

/**
 * Most of the following is loosely copied from
 * amplify-cli/packages/amplify-graphql-docs-generator/src/cli.ts
 */

// / Make sure unhandled errors in async code are propagated correctly
process.on("unhandledRejection", (error) => {
  throw error;
});

process.on("uncaughtException", handleError);

function handleError(error: Error) {
  logError(error);
  process.exit(1);
}

export function run(argv: Array<String>): void {
  // tslint:disable
  yargs
    .command(
      "$0",
      "Generate boilerplate React Apollo hooks for queries, mutations and subscriptions for the provided introspection schema",
      {
        schema: {
          demand: true,
          describe: "Path to introspection schema",
          default: "schema.json",
          normalize: true,
          coerce: path.resolve,
        },
        output: {
          demand: true,
          default: "hooks.ts",
          normalize: true,
          coerce: path.resolve,
        },
        language: {
          demand: true,
          default: Language.TYPESCRIPT,
          normalize: true,
          choices: Object.values(Language),
        },
        statementsImportPath: {
          demand: true,
          describe: "Path to generated statements directory",
          normalize: true,
          coerce: path.resolve,
        },
        typesImportPath: {
          demand: true,
          describe: "Path to generated types file",
          normalize: true,
          coerce: path.resolve,
        },
      },
      async (argv) => {
        generate(argv.schema, argv.output, {
          language: argv.language,
          statementsImportPath: argv.statementsImportPath,
          typesImportPath: argv.typesImportPath,
        });
      }
    )
    .help()
    .version()
    .strict().argv;
}
