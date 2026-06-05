import EditClient from "./EditClient";

export const runtime = "edge";

export default function RuleEditPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return <EditClient id={id} />;
}
