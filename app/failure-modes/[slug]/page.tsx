import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntityDetailPage, entityMetadata } from "@/components/EntityPage";
import { getEntities, getEntity } from "@/lib/entity-pages";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return getEntities("failure").map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const entity = getEntity("failure", (await params).slug); return entity ? entityMetadata(entity) : {}; }
export default async function FailureModePage({ params }: Props) { const entity = getEntity("failure", (await params).slug); if (!entity) notFound(); return <EntityDetailPage entity={entity} />; }
