import { getApiUsersMe } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import PostCreateContent from "../../../_components/PostCreateContent";
import PostCreationRestrictionNotice from "../../../_components/PostCreationRestrictionNotice";
import { getBoard } from "../../../_lib/board";
import { COMMUNITY_BOARD_ID } from "../../../_lib/constants";
import { getActivePostCreationRestriction } from "../../../_lib/post-creation-restriction";

export default async function PostNewPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/sign-in?callbackUrl=/board/community/posts/new");
  }

  const [board, currentUser] = await Promise.all([
    getBoard(COMMUNITY_BOARD_ID, session.accessToken),
    getApiUsersMe(withToken(session.accessToken))
      .then((response) => response.data)
      .catch(() => null),
  ]);
  const restriction = getActivePostCreationRestriction(currentUser);

  if (restriction) {
    return (
      <div className="mx-auto mt-28 max-w-3xl px-4">
        <PostCreationRestrictionNotice restriction={restriction} />
      </div>
    );
  }

  return <PostCreateContent boardId={COMMUNITY_BOARD_ID} postTypes={board?.postTypes ?? []} />;
}
