import { useLocation } from "@tanstack/react-router";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useIsMobile } from "@/hooks/use-mobile";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(segment: string) {
  return UUID_RE.test(segment);
}

function formatSegment(segment: string) {
  if (isUUID(segment)) return segment;
  return segment.replace(/-/g, " ");
}

export function AppBreadcrumb() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { pathname } = location;
  const segments = pathname.split("/").filter((s) => s);

  if (segments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  if (segments.length === 1) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="capitalize">
              {formatSegment(segments[0])}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const first = segments[0];
  const last = segments[segments.length - 1];
  const middle = segments.slice(1, -1);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink className="capitalize" href={`/${first}`}>
            {formatSegment(first)}
          </BreadcrumbLink>
        </BreadcrumbItem>

        {isMobile && middle.length > 0 ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbEllipsis />
            </BreadcrumbItem>
          </>
        ) : (
          middle.map((segment, i) => {
            const href = `/${segments.slice(0, i + 2).join("/")}`;
            return (
              <Fragment key={segment}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink className="capitalize" href={href}>
                    {formatSegment(segment)}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </Fragment>
            );
          })
        )}

        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage
            className={`max-w-[200px] truncate ${isUUID(last) ? "font-mono text-xs" : "capitalize"}`}
          >
            {formatSegment(last)}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
