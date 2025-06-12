import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import AdminHeatmapDownload from "../../components/AdminHeatmapDownload";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 5;

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";

  // Fetch paginated users
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `${BASE}/admin/users?page=${page}&limit=${LIMIT}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = res.data;
        if (!Array.isArray(data.users))
          throw new Error("Invalid response format");
        setUsers(data.users);
        setTotalPages(Math.ceil(data.total / LIMIT));
      } catch (err) {
        console.error(err);
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    })();
  }, [page, token, BASE]);

  // Fetch courses
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${BASE}/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data);
      } catch (err) {
        console.error("Failed to load courses:", err);
      }
    })();
  }, [token, BASE]);

  const handleField = (e) =>
    setNewUser({ ...newUser, [e.target.name]: e.target.value });

  const createUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await axios.post(`${BASE}/admin/users`, newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await axios.get(
        `${BASE}/admin/users?page=${page}&limit=${LIMIT}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers(res.data.users);
      setTotalPages(Math.ceil(res.data.total / LIMIT));
      setNewUser({ name: "", email: "", password: "", role: "student" });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || "Could not create user");
    } finally {
      setSubmitting(false);
    }
  };

  const updateRole = async (userId, role) => {
    try {
      await axios.patch(
        `${BASE}/admin/users/${userId}`,
        { role },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role } : u))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to update role");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <p className="text-gray-300 text-lg">Loading users…</p>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 p-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-lime-400">User Management</h1>
        <div className="flex items-center gap-4">
          <Link
            to="/admin/analytics"
            className="px-4 py-2 bg-lime-400 text-black rounded hover:bg-lime-500"
          >
            View Analytics
          </Link>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded"
          >
            <option value="">Select Course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
          <AdminHeatmapDownload courseId={selectedCourse} />
        </div>
      </div>

      {/* Create User Form */}
      <form onSubmit={createUser} className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl text-lime-400 font-semibold mb-4">
          Add New User
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {["name", "email", "password"].map((f) => (
            <input
              key={f}
              name={f}
              type={f === "password" ? "password" : "text"}
              value={newUser[f]}
              onChange={handleField}
              placeholder={f[0].toUpperCase() + f.slice(1)}
              required
              className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded"
            />
          ))}
          <select
            name="role"
            value={newUser.role}
            onChange={handleField}
            className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-4 py-2 bg-lime-400 text-black rounded hover:bg-lime-500 disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create User"}
        </button>
      </form>

      {/* Users Table */}
      <div className="overflow-auto bg-gray-800 rounded-lg">
        <table className="min-w-full text-left">
          <thead className="bg-gray-700 text-gray-200">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Change</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-gray-700 text-white">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u._id, e.target.value)}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setPage(i + 1)}
            className={`px-4 py-2 rounded ${
              page === i + 1
                ? "bg-lime-400 text-black"
                : "bg-gray-700 text-white hover:bg-lime-500"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="mt-6 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
      >
        Back to Home
      </button>
    </div>
  );
}
