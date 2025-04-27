import { test } from "./action";

export default async function Home() {
  const result = await test();
  return (
    <div>
      {result}
    </div>
  );
}
