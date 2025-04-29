/******************************************************************************
 * AGGREGATES
 *
 * Aggregates are used to calculate values over a set of documents.
 * They are useful for calculating things like the number of notifications
 * a user has, or the number of notifications a user has that are unread.
 ******************************************************************************/

import { components } from "./_generated/api";
import { DataModel, Id } from "./_generated/dataModel";
import { TableAggregate } from "@convex-dev/aggregate";

export const aggregate = new TableAggregate<{
  Namespace: Id<"users">;
  Key: null;
  DataModel: DataModel;
  TableName: "notifications";
}>(components.aggregateUserUnreadNotifications, {
  namespace: (doc) => doc.userId,
  sortKey: () => null,
  sumValue: (doc) => (doc.is_read ? 0 : 1),
});
