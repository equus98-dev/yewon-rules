import EditClient from "./EditClient";

export const runtime = "edge";

export default async function RuleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditClient id={id} />;
}
