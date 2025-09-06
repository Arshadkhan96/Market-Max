import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addUser, deleteUser, updateUser } from "../../redux/slices/adminSlice";

const UserManagement = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { user } = useSelector((state) => state.auth || {})
  const { users = [], loading = false, error = null } = useSelector((state) => state.admin || {})

 useEffect(()=>{
  if(user && user.role !== "admin"){
    navigate("/")
  }
 },[user, navigate])

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "customer", // Default role
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      alert('Please fill in all required fields');
      return;
    }
    
    dispatch(addUser(formData))
      .unwrap()
      .then(() => {
        // Reset the form after successful submission
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "customer",
        });
      })
      .catch(error => {
        console.error('Error adding user:', error);
        // Error is already handled by the slice
      });
  };

  const handleRoleChange = (userId, newRole) => {
    if (!userId) {
      console.error('Cannot update role: Invalid user ID');
      return;
    }
    dispatch(updateUser({ id: userId, role: newRole }))
      .unwrap()
      .catch(error => {
        console.error('Error updating user role:', error);
      });
  };

  const handleDeleteUser = (userId) => {
    if (!userId) {
      console.error('Cannot delete: Invalid user ID');
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this user?")) {
      dispatch(deleteUser(userId))
        .unwrap()
        .catch(error => {
          console.error('Error deleting user:', error);
          // Show error message to user
          alert(`Failed to delete user: ${error.message || 'Unknown error'}`);
        });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">User Management</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error.message || 'An error occurred'}</p>}

      {/* Add New User Form */}
      <div className="p-6 rounded-lg mb-6">
        <h3 className="text-lg font-bold mb-4">Add New User</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button 
            type="submit"
            className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          >
            Add User
          </button>
        </form>
      </div>

      {/* User List */}
      <div className="overflow-x-auto shadow-md md:rounded-lg">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Role</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="p-4 text-center">
                  Loading users...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-red-500">
                  Error: {error}
                </td>
              </tr>
            ) : !users || users.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user?._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{user?.name || 'N/A'}</td>
                  <td className="p-4">{user?.email || 'N/A'}</td>
                  <td className="p-4">
                    <select
                      value={user?.role || 'customer'}
                      onChange={(e) => handleRoleChange(user?._id, e.target.value)}
                      className="p-2 border rounded"
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
