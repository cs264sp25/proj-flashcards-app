/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assistants_helpers from "../assistants_helpers.js";
import type * as assistants_internals from "../assistants_internals.js";
import type * as assistants_mutations from "../assistants_mutations.js";
import type * as assistants_queries from "../assistants_queries.js";
import type * as assistants_schema from "../assistants_schema.js";
import type * as assistants_seed from "../assistants_seed.js";
import type * as auth from "../auth.js";
import type * as cards_guards from "../cards_guards.js";
import type * as cards_helpers from "../cards_helpers.js";
import type * as cards_internals from "../cards_internals.js";
import type * as cards_mutations from "../cards_mutations.js";
import type * as cards_queries from "../cards_queries.js";
import type * as cards_schema from "../cards_schema.js";
import type * as cards_seed from "../cards_seed.js";
import type * as chats_guards from "../chats_guards.js";
import type * as chats_helpers from "../chats_helpers.js";
import type * as chats_internals from "../chats_internals.js";
import type * as chats_mutations from "../chats_mutations.js";
import type * as chats_queries from "../chats_queries.js";
import type * as chats_schema from "../chats_schema.js";
import type * as chats_seed from "../chats_seed.js";
import type * as decks_guards from "../decks_guards.js";
import type * as decks_helpers from "../decks_helpers.js";
import type * as decks_internals from "../decks_internals.js";
import type * as decks_mutations from "../decks_mutations.js";
import type * as decks_queries from "../decks_queries.js";
import type * as decks_schema from "../decks_schema.js";
import type * as decks_seed from "../decks_seed.js";
import type * as errors from "../errors.js";
import type * as files_guards from "../files_guards.js";
import type * as files_helpers from "../files_helpers.js";
import type * as files_internals from "../files_internals.js";
import type * as files_mutations from "../files_mutations.js";
import type * as files_queries from "../files_queries.js";
import type * as files_schema from "../files_schema.js";
import type * as files_seed from "../files_seed.js";
import type * as hello from "../hello.js";
import type * as http from "../http.js";
import type * as http_completions from "../http_completions.js";
import type * as http_helpers from "../http_helpers.js";
import type * as http_messages from "../http_messages.js";
import type * as messages_guards from "../messages_guards.js";
import type * as messages_helpers from "../messages_helpers.js";
import type * as messages_internals from "../messages_internals.js";
import type * as messages_mutations from "../messages_mutations.js";
import type * as messages_queries from "../messages_queries.js";
import type * as messages_schema from "../messages_schema.js";
import type * as messages_seed from "../messages_seed.js";
import type * as notifications_aggregates from "../notifications_aggregates.js";
import type * as notifications_guards from "../notifications_guards.js";
import type * as notifications_helpers from "../notifications_helpers.js";
import type * as notifications_internals from "../notifications_internals.js";
import type * as notifications_mutations from "../notifications_mutations.js";
import type * as notifications_queries from "../notifications_queries.js";
import type * as notifications_schema from "../notifications_schema.js";
import type * as notifications_seed from "../notifications_seed.js";
import type * as openai_assistants from "../openai_assistants.js";
import type * as openai_completions from "../openai_completions.js";
import type * as openai_completions_helpers from "../openai_completions_helpers.js";
import type * as openai_embeddings from "../openai_embeddings.js";
import type * as openai_helpers from "../openai_helpers.js";
import type * as openai_messages from "../openai_messages.js";
import type * as openai_runs from "../openai_runs.js";
import type * as openai_runs_helpers from "../openai_runs_helpers.js";
import type * as openai_schema from "../openai_schema.js";
import type * as openai_threads from "../openai_threads.js";
import type * as openai_tools from "../openai_tools.js";
import type * as openai_voice from "../openai_voice.js";
import type * as prompts from "../prompts.js";
import type * as shared from "../shared.js";
import type * as studies_guards from "../studies_guards.js";
import type * as studies_helpers from "../studies_helpers.js";
import type * as studies_internals from "../studies_internals.js";
import type * as studies_mutations from "../studies_mutations.js";
import type * as studies_queries from "../studies_queries.js";
import type * as studies_schema from "../studies_schema.js";
import type * as studies_seed from "../studies_seed.js";
import type * as users_guards from "../users_guards.js";
import type * as users_helpers from "../users_helpers.js";
import type * as users_internals from "../users_internals.js";
import type * as users_mutations from "../users_mutations.js";
import type * as users_queries from "../users_queries.js";
import type * as users_schema from "../users_schema.js";
import type * as users_seed from "../users_seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assistants_helpers: typeof assistants_helpers;
  assistants_internals: typeof assistants_internals;
  assistants_mutations: typeof assistants_mutations;
  assistants_queries: typeof assistants_queries;
  assistants_schema: typeof assistants_schema;
  assistants_seed: typeof assistants_seed;
  auth: typeof auth;
  cards_guards: typeof cards_guards;
  cards_helpers: typeof cards_helpers;
  cards_internals: typeof cards_internals;
  cards_mutations: typeof cards_mutations;
  cards_queries: typeof cards_queries;
  cards_schema: typeof cards_schema;
  cards_seed: typeof cards_seed;
  chats_guards: typeof chats_guards;
  chats_helpers: typeof chats_helpers;
  chats_internals: typeof chats_internals;
  chats_mutations: typeof chats_mutations;
  chats_queries: typeof chats_queries;
  chats_schema: typeof chats_schema;
  chats_seed: typeof chats_seed;
  decks_guards: typeof decks_guards;
  decks_helpers: typeof decks_helpers;
  decks_internals: typeof decks_internals;
  decks_mutations: typeof decks_mutations;
  decks_queries: typeof decks_queries;
  decks_schema: typeof decks_schema;
  decks_seed: typeof decks_seed;
  errors: typeof errors;
  files_guards: typeof files_guards;
  files_helpers: typeof files_helpers;
  files_internals: typeof files_internals;
  files_mutations: typeof files_mutations;
  files_queries: typeof files_queries;
  files_schema: typeof files_schema;
  files_seed: typeof files_seed;
  hello: typeof hello;
  http: typeof http;
  http_completions: typeof http_completions;
  http_helpers: typeof http_helpers;
  http_messages: typeof http_messages;
  messages_guards: typeof messages_guards;
  messages_helpers: typeof messages_helpers;
  messages_internals: typeof messages_internals;
  messages_mutations: typeof messages_mutations;
  messages_queries: typeof messages_queries;
  messages_schema: typeof messages_schema;
  messages_seed: typeof messages_seed;
  notifications_aggregates: typeof notifications_aggregates;
  notifications_guards: typeof notifications_guards;
  notifications_helpers: typeof notifications_helpers;
  notifications_internals: typeof notifications_internals;
  notifications_mutations: typeof notifications_mutations;
  notifications_queries: typeof notifications_queries;
  notifications_schema: typeof notifications_schema;
  notifications_seed: typeof notifications_seed;
  openai_assistants: typeof openai_assistants;
  openai_completions: typeof openai_completions;
  openai_completions_helpers: typeof openai_completions_helpers;
  openai_embeddings: typeof openai_embeddings;
  openai_helpers: typeof openai_helpers;
  openai_messages: typeof openai_messages;
  openai_runs: typeof openai_runs;
  openai_runs_helpers: typeof openai_runs_helpers;
  openai_schema: typeof openai_schema;
  openai_threads: typeof openai_threads;
  openai_tools: typeof openai_tools;
  openai_voice: typeof openai_voice;
  prompts: typeof prompts;
  shared: typeof shared;
  studies_guards: typeof studies_guards;
  studies_helpers: typeof studies_helpers;
  studies_internals: typeof studies_internals;
  studies_mutations: typeof studies_mutations;
  studies_queries: typeof studies_queries;
  studies_schema: typeof studies_schema;
  studies_seed: typeof studies_seed;
  users_guards: typeof users_guards;
  users_helpers: typeof users_helpers;
  users_internals: typeof users_internals;
  users_mutations: typeof users_mutations;
  users_queries: typeof users_queries;
  users_schema: typeof users_schema;
  users_seed: typeof users_seed;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  aggregateUserUnreadNotifications: {
    btree: {
      aggregateBetween: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any },
        { count: number; sum: number }
      >;
      atNegativeOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      atOffset: FunctionReference<
        "query",
        "internal",
        { k1?: any; k2?: any; namespace?: any; offset: number },
        { k: any; s: number; v: any }
      >;
      get: FunctionReference<
        "query",
        "internal",
        { key: any; namespace?: any },
        null | { k: any; s: number; v: any }
      >;
      offset: FunctionReference<
        "query",
        "internal",
        { k1?: any; key: any; namespace?: any },
        number
      >;
      offsetUntil: FunctionReference<
        "query",
        "internal",
        { k2?: any; key: any; namespace?: any },
        number
      >;
      paginate: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          k1?: any;
          k2?: any;
          limit: number;
          namespace?: any;
          order: "asc" | "desc";
        },
        {
          cursor: string;
          isDone: boolean;
          page: Array<{ k: any; s: number; v: any }>;
        }
      >;
      paginateNamespaces: FunctionReference<
        "query",
        "internal",
        { cursor?: string; limit: number },
        { cursor: string; isDone: boolean; page: Array<any> }
      >;
      validate: FunctionReference<
        "query",
        "internal",
        { namespace?: any },
        any
      >;
    };
    inspect: {
      display: FunctionReference<"query", "internal", { namespace?: any }, any>;
      dump: FunctionReference<"query", "internal", { namespace?: any }, string>;
      inspectNode: FunctionReference<
        "query",
        "internal",
        { namespace?: any; node?: string },
        null
      >;
    };
    public: {
      clear: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      deleteIfExists: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        any
      >;
      delete_: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any },
        null
      >;
      init: FunctionReference<
        "mutation",
        "internal",
        { maxNodeSize?: number; namespace?: any; rootLazy?: boolean },
        null
      >;
      insert: FunctionReference<
        "mutation",
        "internal",
        { key: any; namespace?: any; summand?: number; value: any },
        null
      >;
      makeRootLazy: FunctionReference<
        "mutation",
        "internal",
        { namespace?: any },
        null
      >;
      replace: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        null
      >;
      replaceOrInsert: FunctionReference<
        "mutation",
        "internal",
        {
          currentKey: any;
          namespace?: any;
          newKey: any;
          newNamespace?: any;
          summand?: number;
          value: any;
        },
        any
      >;
    };
  };
};
