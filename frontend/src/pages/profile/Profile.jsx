import { useAuth } from "../../contexts/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h2>Profile</h2>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
