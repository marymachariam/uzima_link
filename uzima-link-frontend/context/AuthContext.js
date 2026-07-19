"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getToken, getRole, decodeToken, saveSession, clearSession } from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const role = getRole();

    if (token && role) {
      const payload = decodeToken();
      setUser({
        token,
        role,
        userId: payload?.user_id ?? null,
        patientId: payload?.patient_id ?? null,
        facilityId: payload?.facility_id ?? null,
      });
    }

    setLoading(false);
  }, []);

  function login(token, role) {
    saveSession(token, role);
    const payload = decodeToken();
    setUser({
      token,
      role,
      userId: payload?.user_id ?? null,
      patientId: payload?.patient_id ?? null,
      facilityId: payload?.facility_id ?? null,
    });
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}