import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LandingView } from "./LandingView";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/panel");

  return <LandingView />;
}
