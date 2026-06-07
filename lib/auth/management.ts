export type ManagementArea = "parent" | "admin";
export type ManagementRole = "PARENT" | "ADMIN";

type ManagementUser = {
  role?: string | null;
};

export type ManagementAccess =
  | { allowed: true }
  | { allowed: false; destination: "/login" | "/parent" };

export function isManagementRole(role: string | null | undefined): role is ManagementRole {
  return role === "PARENT" || role === "ADMIN";
}

export function resolveManagementAccess(
  user: ManagementUser | null | undefined,
  area: ManagementArea = "parent",
): ManagementAccess {
  if (!isManagementRole(user?.role)) {
    return { allowed: false, destination: "/login" };
  }

  if (area === "admin" && user.role !== "ADMIN") {
    return { allowed: false, destination: "/parent" };
  }

  return { allowed: true };
}
