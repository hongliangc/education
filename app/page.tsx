// middleware.ts 会把 / 重定向到 /login 或 /child-select。
// 这里只是兜底。
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
