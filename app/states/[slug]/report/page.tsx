import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  EntityReportPage,
  entityReportMetadata,
} from "@/components/EntityReport";
import { getEntities, getEntity } from "@/lib/entity-pages";

type Params = Record<string, string | string[] | undefined>;
type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Params>;
};

export function generateStaticParams() {
  return getEntities("state").map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entity = getEntity("state", (await params).slug);
  return entity ? entityReportMetadata(entity) : {};
}

export default async function StateReportPage({
  params,
  searchParams,
}: Props) {
  const entity = getEntity("state", (await params).slug);
  if (!entity) notFound();
  return (
    <EntityReportPage
      entity={entity}
      searchParams={(await searchParams) || {}}
    />
  );
}
