export function setUserSession(user: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("allerq_user", JSON.stringify(user));
  }
}

export function getUserSession() {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem("allerq_user");
    return data ? JSON.parse(data) : null;
  }
  return null;
}

export function clearUserSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("allerq_user");
  }
}

export async function deleteUserSession() {
  clearUserSession()
}
