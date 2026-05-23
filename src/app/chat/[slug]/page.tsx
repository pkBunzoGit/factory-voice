import { ChatClient } from "./client";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ChatClient slug={slug} />;
}
