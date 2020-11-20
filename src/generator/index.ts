import * as path from "path";
import * as fs from "fs-extra";
import { camelCase, pascalCase } from "change-case";
import * as handlebars from "handlebars";
import * as prettier from "prettier";

import { loadSchema } from "amplify-graphql-docs-generator/lib/generator/utils/loading";
import generateAllOps, {
  GQLOperationTypeEnum,
  GQLAllOperations,
} from "amplify-graphql-docs-generator/lib/generator";

import {
  apolloOperationsPerGQLOperation,
  FILE_EXTENSION_MAP,
  operationsFilenames,
} from "../constants";
import { Language, OperationsForType, RenderOperationsInput } from "../types";

const TEMPLATE_DIR = path.resolve(path.join(__dirname, "../../templates"));
const DEFAULT_MAX_DEPTH = 3;

const isSupportedLanguage = (language: string): language is Language =>
  (Object.values(Language) as string[]).includes(language);

export const generate = async (
  schemaPath: string,
  outputPath: string,
  options: {
    language: string;
    typesImportPath: string;
    statementsImportPath: string;
  }
) => {
  const { language } = options;

  if (!isSupportedLanguage(language)) {
    throw new Error(
      `${language} is not supported, please use one of ${Object.values(
        Language
      )}.`
    );
  }

  /**
   * The following is copied from
   * amplify-cli/packages/amplify-graphql-docs-generator/src/index.ts
   */
  const schemaData = loadSchema(schemaPath);
  const gqlOperations = generateAllOps(schemaData, DEFAULT_MAX_DEPTH, {
    useExternalFragmentForS3Object: false,
  });

  handlebars.registerHelper("camelCase", camelCase);
  handlebars.registerHelper("format", function (fnOptions) {
    const result = fnOptions.fn();
    return format(result, language);
  });

  /**
   * If the outputPath is not "*.ts" - we need separate files
   */
  const separateFiles = !/\.ts$/g.test(outputPath);
  if (separateFiles) {
    /**
     * Since separate files - ensure containing directory exists
     */
    fs.ensureDirSync(outputPath);
    /**
     * For each gqlOperation - generate hooks and write a file
     */
    for (const gqlOperation of Object.values(GQLOperationTypeEnum)) {
      const operationsPerType = generateOperations(gqlOperations, gqlOperation);
      generateFile(
        operationsPerType,
        outputPath,
        options.typesImportPath,
        options.statementsImportPath,
        language,
        operationsFilenames[gqlOperation] + "." + FILE_EXTENSION_MAP[language]
      );
    }
  } else {
    /**
     * Create an accumulator for all the hooks
     * For each gqlOperation - generate hooks and push them to the accumulator
     * Write a file with all the hooks
     */
    const operationsPerType: OperationsForType[] = [];
    for (const gqlOperation of Object.values(GQLOperationTypeEnum)) {
      generateOperations(
        gqlOperations,
        gqlOperation
      ).forEach((operationsForType) =>
        operationsPerType.push(operationsForType)
      );
    }
    generateFile(
      operationsPerType,
      path.dirname(outputPath),
      options.typesImportPath,
      options.statementsImportPath,
      language,
      path.basename(outputPath)
    );
  }
};

/**
 * Creates a file for the provides operations
 */
const generateFile = (
  operationsPerType: OperationsForType[],
  outputPath: string,
  typesImportPath: string,
  statementsImportPath: string,
  language: Language,
  filename: string
) => {
  const input: RenderOperationsInput = {
    operationsPerType,
    imports: collectImports(
      language,
      operationsPerType,
      path.relative(outputPath, typesImportPath),
      path.relative(outputPath, statementsImportPath)
    ),
  };
  /**
   * The following is loosely copied from
   * amplify-cli/packages/amplify-graphql-docs-generator/src/index.ts
   */
  const rendered = render(input, language);
  const filepath = path.join(outputPath, filename);
  fs.writeFileSync(filepath, rendered);
};

/**
 * Generates OperationsForType[] for the provided gqlOperation
 */
const generateOperations = (
  gqlOperations: GQLAllOperations,
  gqlOperation: GQLOperationTypeEnum
) => {
  /**
   * Create an accumulator
   */
  const operationsPerType: OperationsForType[] = [];
  /**
   * Each gqlOperation might have multiple apolloOperations to generate
   * ex. query: [useApolloQuery, useApolloLazyQuery]
   */
  const apolloOperations = apolloOperationsPerGQLOperation[gqlOperation];
  for (const apolloOperation of apolloOperations) {
    const ops = gqlOperations[operationsFilenames[gqlOperation]];
    if (ops.length) {
      const operations = ops.map((operation) => ({
        hookName: "use" + operation.name + apolloOperation,
        operationName: camelCase(operation.name),
        operationType: operation.name + pascalCase(gqlOperation),
        variablesType:
          operation.args.length > 0
            ? operation.name + pascalCase(gqlOperation) + "Variables"
            : undefined,
      }));
      operationsPerType.push({ gqlOperation, apolloOperation, operations });
    }
  }
  return operationsPerType;
};

function format(str: string, language: Language) {
  /**
   * The following is loosely copied from
   * amplify-cli/packages/amplify-graphql-docs-generator/src/index.ts
   */
  const parserMap: Record<Language, prettier.Options["parser"]> = {
    [Language.JAVASCRIPT]: "babel",
    [Language.TYPESCRIPT]: "typescript",
  };
  return prettier.format(str, { parser: parserMap[language] });
}

function render(doc: RenderOperationsInput, language: Language) {
  /**
   * The following is loosely copied from
   * amplify-cli/packages/amplify-graphql-docs-generator/src/index.ts
   */
  const templateFiles: Record<Language, string> = {
    [Language.JAVASCRIPT]: "javascript.hbs",
    [Language.TYPESCRIPT]: "typescript.hbs",
  };

  const templatePath = path.join(TEMPLATE_DIR, templateFiles[language]);
  const templateStr = fs.readFileSync(templatePath, "utf8");

  const template = handlebars.compile(templateStr, {
    noEscape: true,
    preventIndent: true,
  });
  const gql = template(doc);
  return format(gql, language);
}

/**
 * Collects imports for operations to be rendered.
 */
const collectImports = (
  language: Language,
  operationsPerType: OperationsForType[],
  typesRelativePath: string,
  statementsRelativePath: string
) => {
  /**
   * Create an accumulator
   */
  const imports: RenderOperationsInput["imports"] = {};

  /**
   * A helper function to push values to unique keys in the accumulator
   */
  const add = (key: string, value: string) => {
    if (!imports[key]) {
      imports[key] = [];
    }
    if (!imports[key].includes(value)) {
      imports[key].push(value);
    }
  };

  /**
   * Loop through all operation types and their operations
   */
  operationsPerType.forEach((operationsForType) => {
    operationsForType.operations.forEach((operation) => {
      /**
       * Add apollo imports
       */
      add("@apollo/client", "use" + operationsForType.apolloOperation);
      if (language === Language.TYPESCRIPT) {
        add(
          "@apollo/client",
          operationsForType.apolloOperation + "HookOptions"
        );
      }

      if (language === Language.TYPESCRIPT) {
        /**
         * Add operation return type import
         * and operation variables type import if such exist
         */
        typesRelativePath = ensureRelativePath(typesRelativePath);
        add(typesRelativePath, operation.operationType);
        if (operation.variablesType) {
          add(typesRelativePath, operation.variablesType);
        }
      }

      /**
       * Create operation gql import by appending gqlOperation type and add it
       */
      statementsRelativePath = ensureRelativePath(statementsRelativePath);
      let opsFilename = path.join(
        statementsRelativePath,
        operationsFilenames[operationsForType.gqlOperation]
      );
      add(opsFilename, operation.operationName);
    });
  });

  return imports;
};

/**
 * Checks if the path starts with a ".", and if not - prepeds "./"
 */
const ensureRelativePath = (pathToCheck: string) =>
  pathToCheck[0] !== "." ? "." + path.sep + pathToCheck : pathToCheck;
