import api from "./api";

export const loginStudent = async (payload) => {
  const { data } = await api.post("/auth/student/login", payload);
  return data;
};

export const loginAdmin = async (payload) => {
  const { data } = await api.post("/auth/admin/login", payload);
  return data;
};

export const signupStudent = async (formData) => {
  const { data } = await api.post("/auth/student/signup", formData);
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};
