import { getSessionUser } from "@/lib/session/cookieSession";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Welcome, {user.display_name}</h1>
      <p>Your role: {user.role}</p>

      {user.role === "admin" && (
        <div className="bg-gray-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Admin Tools</h2>
          <ul className="list-disc ml-6 mt-2">
            <li>Manage restaurants</li>
            <li>Manage users</li>
            <li>View analytics</li>
          </ul>
        </div>
      )}

      {user.role === "manager" && (
        <div className="bg-gray-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Manager Dashboard</h2>
          <ul className="list-disc ml-6 mt-2">
            <li>Oversee menu updates</li>
            <li>Assign staff</li>
          </ul>
        </div>
      )}

      {user.role === "staff" && (
        <div className="bg-gray-100 p-4 rounded shadow">
          <h2 className="text-lg font-semibold">Staff View</h2>
          <ul className="list-disc ml-6 mt-2">
            <li>View assigned menus</li>
            <li>Submit updates</li>
          </ul>
        </div>
      )}

      <form action="/sign-out/actions" method="post">
        <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded mt-4">
          Sign out
        </button>
      </form>
    </div>
  );
}
