// Utility functions to interact with backend API
const API_URL = 'http://localhost:5002';

export const getStudents = async () => {
  const res = await fetch(`${API_URL}/students`);
  if (!res.ok) throw new Error('Failed to fetch students');
  return await res.json();
};

export const searchStudents = async (searchTerm) => {
  const res = await fetch(`${API_URL}/students?search=${encodeURIComponent(searchTerm)}`);
  if (!res.ok) throw new Error('Failed to search students');
  return await res.json();
};

export const addStudent = async (studentName, studentAddress, email, phone) => {
  const res = await fetch(`${API_URL}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentName, studentAddress, email, phone })
  });
  if (!res.ok) throw new Error('Failed to add student');
  return await res.json();
}; 