import { useLocation } from "@tanstack/react-router";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AppBreadcrumb() {
  const location = useLocation();
  const { pathname } = location;
  const pathNames = pathname.split("/").filter((path) => path);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {pathname === "/" ? (
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <>
            {pathNames.map((pathName, index) => {
              if (index === 0) {
                return (
                  <Fragment key={pathName}>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink
                        className="capitalize"
                        href={`/${pathName}`}
                      >
                        {pathName}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                  </Fragment>
                );
              }

              return (
                <BreadcrumbItem key={pathName}>
                  <BreadcrumbPage className="capitalize">
                    {pathName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              );
            })}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
