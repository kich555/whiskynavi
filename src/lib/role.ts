export const isAdminUser = (roles: string[]): boolean => {
  return roles.includes("ROLE_ADMIN") || roles.includes("ROLE_SUPER_ADMIN");
};
