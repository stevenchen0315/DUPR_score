import React, { useState } from "react";
import { Trash2, Pencil, Plus, Download } from "lucide-react";

export default function App() {
  const [activeSheet, setActiveSheet] = useState("選手資料");
  const [userInfo, setUserInfo] = useState({ duprid: "", nickname: "" });
  const [userList, setUserList] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  const [rows, setRows] = useState([
    {
      values: ["", "", "", ""], // 團隊A, 團隊A, 團隊B, 團隊B
      sd: "",
      h: "",
      i: "",
      lock: "解鎖",
    },
  ]);

  const updateUserInfo = (field, value) => {
    setUserInfo({ ...userInfo, [field]: value });
  };

  const addUser = () => {
    if (!userInfo.duprid || !userInfo.nickname) return;
    if (editIndex !== null) {
      const updated = [...userList];
      updated[editIndex] = userInfo;
      setUserList(updated);
      setEditIndex(null);
    } else {
      setUserList([...userList, userInfo]);
    }
    setUserInfo({ duprid: "", nickname: "" });
  };

  const editUser = (index) => {
    setUserInfo(userList[index]);
    setEditIndex(index);
  };

  const deleteUser = (index) => {
    const updated = [...userList];
    updated.splice(index, 1);
    setUserList(updated);
  };

  const updateCell = (rowIndex, field, value) => {
    const newRows = [...rows];
    if (field === "h" || field === "i" || field === "lock" || field === "sd") {
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
    return userList.map((u) => u.nickname).filter((n) => !selected.includes(n));
  };

  const isLocked = (row) => row.lock === "鎖定";

  const addRow = () => {
    setRows([
      ...rows,
      {
        values: ["", "", "", ""],
        sd: "",
        h: "",
        i: "",
        lock: "解鎖",
      },
    ]);
  };

  const exportCSV = () => {
    const today = new Date().toISOString().slice(0, 10);
    const findUser = (nickname) => userList.find((u) => u.nickname === nickname) || {};

    const csvRows = rows.map((row) => {
      const [a1, a2, b1, b2] = row.values;
      const a1User = findUser(a1);
      const a2User = findUser(a2);
      const b1User = findUser(b1);
      const b2User = findUser(b2);

      return [
        "", "", "",              // A, B, C
        row.sd,                   // D
        "",                        // E
        today,                    // F
        a1User.nickname || "",    // G
        a1User.duprid || "",      // H
        "",                       // I
        a2User.nickname || "",    // J
        a2User.duprid || "",      // K
        "",                       // L
        b1User.nickname || "",    // M
        b1User.duprid || "",      // N
        "",                       // O
        b2User.nickname || "",    // P
        b2User.duprid || "",      // Q
        "", "",                    // R, S
        row.h,                    // T
        row.i                     // U
      ];
    });

    const csvContent = csvRows
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <button
          className={`px-4 py-2 rounded-l ${
            activeSheet === "選手資料" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveSheet("選手資料")}
        >
          選手資料
        </button>
        <button
          className={`px-4 py-2 rounded-r ${
            activeSheet === "資料輸入" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveSheet("資料輸入")}
        >
          資料輸入
        </button>
      </div>

      {activeSheet === "選手資料" && (
        <div className="space-y-4 max-w-md">
          <h2 className="text-xl font-bold">選手資訊</h2>
          <div>
            <label className="block font-medium">DUPRID</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={userInfo.duprid}
              onChange={(e) => updateUserInfo("duprid", e.target.value)}
            />
          </div>
          <div>
            <label className="block font-medium">暱稱</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={userInfo.nickname}
              onChange={(e) => updateUserInfo("nickname", e.target.value)}
            />
          </div>
          <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={addUser}>
            {editIndex !== null ? "更新" : "新增"}
          </button>

          <ul className="divide-y border rounded mt-4">
            {userList.map((user, index) => (
              <li key={index} className="flex items-center justify-between p-2">
                <div>
                  <strong>{user.nickname}</strong> <span className="text-sm text-gray-500">({user.duprid})</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editUser(index)} className="text-blue-500">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => deleteUser(index)} className="text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeSheet === "資料輸入" && (
        <div className="overflow-auto">
          <table className="min-w-full table-auto border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2">團隊A</th>
                <th className="border p-2">團隊A</th>
                <th className="border p-2">團隊B</th>
                <th className="border p-2">團隊B</th>
                <th className="border p-2">S/D</th>
                <th className="border p-2">團隊A分數</th>
                <th className="border p-2">團隊B分數</th>
                <th className="border p-2">鎖定</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {"DEFG".split("").map((col, i) => (
                    <td key={col} className="border p-2">
                      <select
                        className="w-full border rounded p-1"
                        value={row.values[i]}
                        disabled={isLocked(row)}
                        onChange={(e) => updateCell(rowIndex, col, e.target.value)}
                      >
                        <option value="">請選擇</option>
                        {getFilteredOptions(row, i).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                  <td className="border p-2 text-center">{row.sd}</td>
                  <td className="border p-2">
                    <input
                      type="text"
                      className="w-full p-1 border rounded"
                      value={row.h}
                      disabled={isLocked(row)}
                      onChange={(e) => updateCell(rowIndex, "h", e.target.value)}
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      type="text"
                      className="w-full p-1 border rounded"
                      value={row.i}
                      disabled={isLocked(row)}
                      onChange={(e) => updateCell(rowIndex, "i", e.target.value)}
                    />
                  </td>
                  <td className="border p-2">
                    <select
                      className="w-full border rounded p-1"
                      value={row.lock}
                      onChange={(e) => updateCell(rowIndex, "lock", e.target.value)}
                    >
                      <option value="解鎖">解鎖</option>
                      <option value="鎖定">鎖定</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex gap-4">
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Plus size={16} /> 新增一列
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Download size={16} /> 匯出 CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
