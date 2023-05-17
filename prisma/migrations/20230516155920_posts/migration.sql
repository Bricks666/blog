-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostAttachedFiles" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "file" TEXT NOT NULL,

    CONSTRAINT "PostAttachedFiles_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAttachedFiles" ADD CONSTRAINT "PostAttachedFiles_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
