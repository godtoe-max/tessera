import { AuthenticationError } from "@/lib/auth/current-viewer";
import { NotFoundOrForbiddenError } from "@/lib/auth/authorization";

export function apiError(error:unknown){
  if(error instanceof AuthenticationError) return Response.json({error:error.message},{status:401});
  if(error instanceof NotFoundOrForbiddenError) return Response.json({error:error.message},{status:404});
  console.error(error);
  return Response.json({error:"Unable to complete the request"},{status:500});
}

