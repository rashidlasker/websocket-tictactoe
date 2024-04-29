-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activeGameId" INTEGER
);

-- CreateTable
CREATE TABLE "Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "room" TEXT NOT NULL,
    "playerX" TEXT NOT NULL,
    "playerO" TEXT NOT NULL,
    "board" TEXT NOT NULL,
    "nextPlayer" TEXT NOT NULL,
    "gameState" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
