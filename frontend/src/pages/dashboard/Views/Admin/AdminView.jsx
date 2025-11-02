const AdminView = ({ user }) => (
  <div>
    <h2>🛠 Welcome Admin, {user.name}</h2>
    <p>Manage users, roles, and platform settings here.</p>
  </div>
);

export default AdminView;
