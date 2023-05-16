-- DropForeignKey
ALTER TABLE "PostAttachedFiles" DROP CONSTRAINT "PostAttachedFiles_postId_fkey";

-- AddForeignKey
ALTER TABLE "PostAttachedFiles" ADD CONSTRAINT "PostAttachedFiles_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
