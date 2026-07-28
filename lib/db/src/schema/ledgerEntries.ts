import { pgTable, text, serial, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const ledgerTypeEnum = pgEnum("ledger_type", ["payable", "receivable"]);
export const ledgerStatusEnum = pgEnum("ledger_status", ["outstanding", "settled"]);

export const ledgerEntriesTable = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: ledgerTypeEnum("type").notNull(), // 'payable' = you owe (Debt), 'receivable' = owed to you (Credit)
  counterpartyName: text("counterparty_name").notNull(),
  amount: real("amount").notNull(),
  status: ledgerStatusEnum("status").notNull().default("outstanding"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  note: text("note"),
  entryDate: timestamp("entry_date", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLedgerEntrySchema = createInsertSchema(ledgerEntriesTable).omit({
  id: true, createdAt: true, updatedAt: true,
});

export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;
export type LedgerEntry = typeof ledgerEntriesTable.$inferSelect;
