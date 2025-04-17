'use client';
import React, { useEffect, useState } from "react";
import { Trash2, Pencil, Plus, Download } from "lucide-react";

// 定義 User 型別
type User = {
  duprid: string;
  nickname: string;
};

export default function App() {
  const [activeSheet, setActiveSheet] = useState("選手資料");
  const [userInfo, setUserInfo] = useState<User>({ duprid: "", nickname: "" });
  const [userList, setUserList] = useState<User[]>([]);  // 指定型別為 User[]
  const [editIndex, setEditIndex] = useState<number | null>(null); // 編輯索引，可以是數字或 null

  const [rows, setRows] = useState([
    {
      values: ["", "", "", ""],
      sd: "",
      h: "",
      i: "",
      lock: "解鎖",
    },
  ]);

  // 讀取 Edge Config 上的選手資料
  useEffect(() => {
    fetch('/api/users')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.text(); // 不直接用 res.json()
      })
      .then((text) => {
        if (!text) return []; // 空內容時回傳空陣列
        return JSON.parse(text); // 手動 parse JSON
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setUserList(data);
        } else {
          console.warn("Invalid user list:", data);
        }
      })
      .catch((err) => {
        console.error("Error loading users:", err);
      });
  }, []);

  const saveUsersToEdge = (list: User[]) => {
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    });
  };

  const updateUserInfo = (field: keyof User, value: string) => {
    setUserInfo({ ...userInfo, [field]: value });
  };

  const addUser = () => {
    if (!userInfo.duprid || !userInfo.nickname) return;
    let updated: User[];
    if (editIndex !== null) {
      updated = [...userList];
      updated[editIndex] = userInfo;
      setEditIndex(null);
    } else {
      updated = [...userList, userInfo];
    }
    setUserList(updated);
    setUserInfo({ duprid: "", nickname: "" });
    saveUsersToEdge(updated);
  };

  const editUser = (index: number) => {
    setUserInfo(userList[index]);
    setEditIndex(index);
  };

  const deleteUser = (index: number) => {
    const updated = [...userList];
    updated.splice(index, 1);
    setUserList(updated);
    saveUsersToEdge(updated);
  };

  const updateCell = (rowIndex: number, field: string, value: string) => {
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

  const getFilteredOptions = (row: any, currentIndex: number) => {
    const selected = row.values.filter((v: string, i: number) => v && i !== currentIndex);
    return userList.map((u) => u.nickname).filter((n) => !selected.includes(n));
  };

  const isLocked = (row: any) => row.lock === "鎖定";

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
    const findUser = (nickname: string) => userList.find((u) => u.nickname === nickname) || {};

    const csvRows = rows.map((row: any) => {
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
      .map((r: any) => r.map((v: string) => `"${v}"`).join(","))
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
      {/* 畫面邏輯保持不變 */}
    </div>
  );
}
