export type VerifiedIdentity={subject:string;email:string;emailVerified:boolean;issuedAt:number;expiresAt:number};
export type IdentityInvite={id:string;email:string;expiresAt:Date};

/** Provider boundary implemented with Netlify Identity after the site is connected. */
export interface IdentityProvider {
  verifySession(token:string):Promise<VerifiedIdentity|null>;
  invite(email:string):Promise<IdentityInvite>;
  revokeInvite(id:string):Promise<void>;
  disableAccount(subject:string):Promise<void>;
}
