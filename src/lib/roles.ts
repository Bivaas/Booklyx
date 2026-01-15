/**
 * Role enum - shared between client and server
 * This is NOT tied to Mongoose or any server-only libraries
 */
export enum Role {
  ADMIN = "admin",
  OWNER = "owner",
  STAFF = "staff",
  CUSTOMER = "customer",
}
