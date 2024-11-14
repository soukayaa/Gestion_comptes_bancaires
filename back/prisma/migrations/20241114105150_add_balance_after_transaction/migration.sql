/*
  Warnings:

  - Added the required column `balanceAfterTransaction` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "balanceAfterTransaction" DOUBLE PRECISION NOT NULL;
