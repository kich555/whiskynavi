import { getServerSession } from "next-auth";
import { authOptions, getAuthToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import PostCreateContent from "./_components/PostCreateContent";

export default async function PostNewPage() {
  const [session, token] = await Promise.all([
    getServerSession(authOptions),
    getAuthToken(),
  ]);
  if (!session) {
    redirect("/sign-in?callbackUrl=/community/posts/new");
  }
  return <PostCreateContent token={token ?? ""} />;
}