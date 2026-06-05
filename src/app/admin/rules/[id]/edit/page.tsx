import EditClient from "./EditClient";

export default async function RuleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditClient id={id} />;
}
