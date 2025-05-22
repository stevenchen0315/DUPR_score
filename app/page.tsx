'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { player_info, score } from '@/types'
import { FiEdit as Pencil, FiTrash2 as Trash2, FiPlus as Plus, FiDownload as Download } from 'react-icons/fi';

export default function App() {
  const [activeSheet] = useState("選手資料");
  const [userInfo, setUserInfo] = useState<player_info>({ dupr_id: "", name: "" });
  const [userList, setUserList] = useState<player_info[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const [rows, setRows] = useState([
    { values: ["", "", "", ""], sd: "", h: "", i: "", lock: "解鎖" },
  ]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('player_info')
        .select('dupr_id, name');
      if (error) {
        console.error('Error fetching users:', error.message);
      } else if (data) {
        setUserList(data); // 直接使用 data，無需再 map
      }
    }
    fetchUsers();
  }, []);

  // 儲存所有使用者到 Supabase
const saveUserToSupabase = async (list: player_info[]) => {
  try {
    const { error: deleteError } = await supabase
      .from("player_info")
      .delete()
      .neq("dupr_id", "");

    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from("player_info")
      .insert(list);

    if (insertError) throw insertError;
  } catch (error: any) {
    console.error("Supabase save error:", error.message);
  }
};

// 輸入時更新 userInfo
const updateUserInfo = (field: keyof player_info, value: string) => {
  setUserInfo((prev) => ({ ...prev, [field]: value }));
};

// 新增或更新使用者
const addUser = async () => {
  if (!userInfo.dupr_id || !userInfo.name) return;

  const updated = [...userList];
  if (editIndex !== null) {
    updated[editIndex] = userInfo;
    setEditIndex(null);
  } else {
    updated.push(userInfo);
  }

  setUserList(updated);
  setUserInfo({ dupr_id: "", name: "" });
  await saveUserToSupabase(updated);
};

// 編輯
const editUser = (index: number) => {
  setUserInfo(userList[index]);
  setEditIndex(index);
};

// 刪除
const deleteUser = async (index: number) => {
  const updated = [...userList];
  updated.splice(index, 1);
  setUserList(updated);
  await saveUserToSupabase(updated);
};

  type CellField = "D" | "E" | "F" | "G";
  type OtherField = "h" | "i" | "lock" | "sd";

const updateCell = (rowIndex: number, field: CellField | OtherField, value: string) => {
  const newRows = [...rows];
  if (["h", "i", "lock", "sd"].includes(field)) {
    (newRows[rowIndex] as any)[field] = value;
  } else {
    const colIndex = { D: 0, E: 1, F: 2, G: 3 }[field as CellField];
    newRows[rowIndex].values[colIndex] = value;
  }

  const [a1, a2, b1, b2] = newRows[rowIndex].values;
  const teamACount = [a1, a2].filter(Boolean).length;
  const teamBCount = [b1, b2].filter(Boolean).length;
  newRows[rowIndex].sd = teamACount === 1 && teamBCount === 1 ? "S" : (teamACount === 2 && teamBCount === 2 ? "D" : "");

  setRows(newRows);
};

type Row = {
  values: string[];
  sd: string;
  h: string;
  i: string;
  lock: string;
};

const getFilteredOptions = (row: Row, currentIndex: number) => {
  const selected = row.values.filter((v, i) => v && i !== currentIndex);
  return userList.map(u => u.name).filter(n => !selected.includes(n));
};

  const isLocked = (row: Row) => row.lock === "鎖定";

  const addRow = () => {
    setRows([...rows, { values: ["", "", "", ""], sd: "", h: "", i: "", lock: "解鎖" }]);
  };
  
  const deleteRow = (index: number) => {
  const updated = [...rows];
  updated.splice(index, 1);
  setRows(updated);
  };

  const exportCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    const findUser = (name: string): player_info => 
    userList.find(u => u.name === name) || { dupr_id: "", name: "" };

    const csvRows = rows.map((row) => {
      const [a1, a2, b1, b2] = row.values;
      const a1User = findUser(a1), a2User = findUser(a2);
      const b1User = findUser(b1), b2User = findUser(b2);
      return [
        "", "", "", row.sd, "", today,
        a1User.name || "", a1User.dupr_id || "", "",
        a2User.name || "", a2User.dupr_id || "", "",
        b1User.name || "", b1User.dupr_id || "", "",
        b2User.name || "", b2User.dupr_id || "", "", "",
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
          value={userInfo.dupr_id}
          onChange={(e) => updateUserInfo("dupr_id", e.target.value)}
        />
        <input
          className="border px-2 py-1 flex-1"
          placeholder="暱稱(nickname)"
          value={userInfo.name}
          onChange={(e) => updateUserInfo("name", e.target.value)}
        />
        <button
          onClick={addUser}
          className="bg-blue-600 text-white px-4 py-1 rounded"
        >
          {editIndex !== null ? "更新選手(Update Player)" : "新增選手(Add Player)"}
        </button>
      </div>

      <ul className="mb-8 space-y-2">
        {userList.map((user, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <span>{user.name} ({user.dupr_id})</span>
            <button onClick={() => editUser(idx)} className="text-blue-500"><Pencil size={16} /></button>
            <button onClick={() => deleteUser(idx)} className="text-red-500"><Trash2 size={16} /></button>
          </li>
        ))}
      </ul>

      <button
        onClick={addRow}
        className="mb-4 bg-green-600 text-white px-3 py-1 rounded inline-flex items-center"
      >
        <Plus size={16} className="mr-1" /> 新增比賽組(Add Match)
      </button>

      <table className="w-full border text-sm mb-6">
        <thead>
          <tr>
            <th className="border p-1">A1</th>
            <th className="border p-1">A2</th>
            <th className="border p-1">B1</th>
            <th className="border p-1">B2</th>
            <th className="border p-1">S/D</th>
            <th className="border p-1">Team A</th>
            <th className="border p-1">Team B</th>
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
                    onChange={(e) => updateCell(rowIndex, ["D", "E", "F", "G"][i] as CellField, e.target.value)}
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
			  <td className="border p-1 text-center">
                <button
                  onClick={() => deleteRow(rowIndex)}
                  disabled={isLocked(row)}
                  className={`px-2 py-1 rounded text-white ${isLocked(row) ? "bg-gray-300 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
                >
                  刪除(Delete)
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