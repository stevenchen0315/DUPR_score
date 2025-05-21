'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PlayerInfo, Score } from '@/types'

export default function App() {
  const [activeSheet] = useState("選手資料");
  const [userInfo, setUserInfo] = useState({ duprid: "", nickname: "" });
  const [userList, setUserList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  const [rows, setRows] = useState([
    { values: ["", "", "", ""], sd: "", h: "", i: "", lock: "解鎖" },
  ]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.ok ? res.text() : Promise.reject('fetch error'))
      .then(text => text ? JSON.parse(text) : [])
      .then(setUserList)
      .catch(err => console.error("Error loading users:", err));
  }, []);

  const saveUsersToEdge = (list) => {
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    });
  };

  const updateUserInfo = (field, value) => {
    setUserInfo({ ...userInfo, [field]: value });
  };

  const addUser = () => {
    if (!userInfo.duprid || !userInfo.nickname) return;
    const updated = [...userList];
    if (editIndex !== null) {
      updated[editIndex] = userInfo;
      setEditIndex(null);
    } else {
      updated.push(userInfo);
    }
    setUserList(updated);
    setUserInfo({ duprid: "", nickname: "" });
    saveUsersToEdge(updated);
  };

  const editUser = (index) => {
    setUserInfo(userList[index]);
    setEditIndex(index);
  };

  const deleteUser = (index) => {
    const updated = [...userList];
    updated.splice(index, 1);
    setUserList(updated);
    saveUsersToEdge(updated);
  };

  const updateCell = (rowIndex, field, value) => {
    const newRows = [...rows];
    if (["h", "i", "lock", "sd"].includes(field)) {
      newRows[rowIndex][field] = value;
    } else {
      const colIndex = { D: 0, E: 1, F: 2, G: 3 }[field];
      newRows[rowIndex].values[colIndex] = value;
    }

    const [a1, a2, b1, b2] = newRows[rowIndex].values;
    const teamACount = [a1, a2].filter(Boolean).length;
    const teamBCount = [b1, b2].filter(Boolean).length;
    newRows[rowIndex].sd = teamACount === 1 && teamBCount === 1 ? "S" : (teamACount === 2 && teamBCount === 2 ? "D" : "");

    setRows(newRows);
  };

  const getFilteredOptions = (row, currentIndex) => {
    const selected = row.values.filter((v, i) => v && i !== currentIndex);
    return userList.map(u => u.nickname).filter(n => !selected.includes(n));
  };

  const isLocked = (row) => row.lock === "鎖定";

  const addRow = () => {
    setRows([...rows, { values: ["", "", "", ""], sd: "", h: "", i: "", lock: "解鎖" }]);
  };

  const exportCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    const findUser = (nickname) => userList.find(u => u.nickname === nickname) || {};

    const csvRows = rows.map((row) => {
      const [a1, a2, b1, b2] = row.values;
      const a1User = findUser(a1), a2User = findUser(a2);
      const b1User = findUser(b1), b2User = findUser(b2);
      return [
        "", "", "", row.sd, "", today,
        a1User.nickname || "", a1User.duprid || "", "",
        a2User.nickname || "", a2User.duprid || "", "",
        b1User.nickname || "", b1User.duprid || "", "",
        b2User.nickname || "", b2User.duprid || "", "", "",
        row.h, row.i
      ];
    });

    const csvContent = csvRows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{activeSheet}</h1>

      <div className="mb-6 flex gap-2">
        <input
          className="border px-2 py-1 flex-1"
          placeholder="DUPR ID"
          value={userInfo.duprid}
          onChange={(e) => updateUserInfo("duprid", e.target.value)}
        />
        <input
          className="border px-2 py-1 flex-1"
          placeholder="暱稱"
          value={userInfo.nickname}
          onChange={(e) => updateUserInfo("nickname", e.target.value)}
        />
        <button
          onClick={addUser}
          className="bg-blue-600 text-white px-4 py-1 rounded"
        >
          {editIndex !== null ? "更新選手" : "新增選手"}
        </button>
      </div>

      <ul className="mb-8 space-y-2">
        {userList.map((user, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span>{user.nickname} ({user.duprid})</span>
            <button onClick={() => editUser(idx)} className="text-blue-500"><Pencil size={16} /></button>
            <button onClick={() => deleteUser(idx)} className="text-red-500"><Trash2 size={16} /></button>
          </li>
        ))}
      </ul>

      <button
        onClick={addRow}
        className="mb-4 bg-green-600 text-white px-3 py-1 rounded inline-flex items-center"
      >
        <Plus size={16} className="mr-1" /> 新增比賽組
      </button>

      <table className="w-full border text-sm mb-6">
        <thead>
          <tr>
            <th className="border p-1">A1</th>
            <th className="border p-1">A2</th>
            <th className="border p-1">B1</th>
            <th className="border p-1">B2</th>
            <th className="border p-1">S/D</th>
            <th className="border p-1">T</th>
            <th className="border p-1">U</th>
            <th className="border p-1">狀態</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.values.map((val, i) => (
                <td key={i} className="border p-1">
                  <select
                    value={val}
                    disabled={isLocked(row)}
                    onChange={(e) => updateCell(rowIndex, ["D", "E", "F", "G"][i], e.target.value)}
                  >
                    <option value="">--</option>
                    {getFilteredOptions(row, i).map((opt, idx) => (
                      <option key={idx} value={opt}>{opt}</option>
                    ))}
                  </select>
                </td>
              ))}
              <td className="border p-1">{row.sd}</td>
              <td className="border p-1">
                <input
                  type="text"
                  value={row.h}
                  onChange={(e) => updateCell(rowIndex, "h", e.target.value)}
                  disabled={isLocked(row)}
                  className="w-full border px-1"
                />
              </td>
              <td className="border p-1">
                <input
                  type="text"
                  value={row.i}
                  onChange={(e) => updateCell(rowIndex, "i", e.target.value)}
                  disabled={isLocked(row)}
                  className="w-full border px-1"
                />
              </td>
              <td className="border p-1 text-center">
                <button
                  onClick={() => updateCell(rowIndex, "lock", row.lock === "鎖定" ? "解鎖" : "鎖定")}
                  className={`px-2 py-1 rounded text-white ${row.lock === "鎖定" ? "bg-red-500" : "bg-gray-400"}`}
                >
                  {row.lock}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={exportCSV}
        className="bg-yellow-500 text-white px-4 py-2 rounded inline-flex items-center"
      >
        <Download size={18} className="mr-2" /> 匯出 CSV
      </button>
    </div>
  );
}