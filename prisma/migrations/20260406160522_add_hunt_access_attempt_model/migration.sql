-- CreateTable
CREATE TABLE "HuntAccessAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "huntId" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HuntAccessAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HuntAccessAttempt_userId_huntId_key" ON "HuntAccessAttempt"("userId", "huntId");

-- AddForeignKey
ALTER TABLE "HuntAccessAttempt" ADD CONSTRAINT "HuntAccessAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntAccessAttempt" ADD CONSTRAINT "HuntAccessAttempt_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "Hunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
