import { cache } from "react";
import { prisma } from "@/lib/prisma";

/** 同一 RSC 请求内去重，避免布局与多个子组件重复查库 */
export const getUserApprovalById = cache(async (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: { approved: true },
  }),
);
