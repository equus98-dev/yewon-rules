import React from "react";
import RevisionClient from "./RevisionClient";

export default async function RevisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RevisionClient id={id} />;
}
