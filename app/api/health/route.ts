import { NextResponse } from "next/server";

export function GET(){
  return NextResponse.json({ service:"tessera", status:"ok" });
}
