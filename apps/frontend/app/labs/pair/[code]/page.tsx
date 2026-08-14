import type { Metadata } from "next";
import ApproveNotebook from "@/components/labs/ApproveNotebook";

export const metadata: Metadata = { title: "Approve notebook" };

/**
 * Where `distill.login()` sends the learner: the URL the notebook printed,
 * carrying the device code it is polling on. Everything after the URL is
 * client-side — who is signed in decides what the page does, and the session
 * cookie is the one credential the approval spends.
 */
export default async function PairPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return <ApproveNotebook code={(await params).code} />;
}
