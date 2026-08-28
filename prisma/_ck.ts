import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { sealData } from "iron-session";
async function main(){
  const u=new URL(process.env.DATABASE_URL!);
  ["connection_limit","pool_timeout","connect_timeout","socket_timeout","max_idle_connection_lifetime"].forEach(k=>u.searchParams.delete(k));
  const db=new PrismaClient({adapter:new PrismaPg({connectionString:u.toString(),max:1})});
  const a=await db.adminUser.upsert({where:{email:"verify@local.test"},update:{},create:{email:"verify@local.test",passwordHash:await bcrypt.hash("x",10),name:"V"}});
  console.log(await sealData({userId:a.id,email:a.email,role:a.role??"ADMIN"},{password:process.env.AUTH_SECRET!,ttl:28800}));
  await db.$disconnect();
}
main();
