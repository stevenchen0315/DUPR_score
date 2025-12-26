import { formatDateTime } from '@/lib/constants'
import { FaLock, FaLockOpen } from 'react-icons/fa'
import { FiTrash2 as Trash2 } from 'react-icons/fi'

interface UnifiedScoreTableProps {
  filteredRows: any[]
  selectedPlayerFilter: string
  partnerNumbers: {[key: string]: number | null}
  isOpenMode: boolean
  readonly?: boolean
  onUpdateCell?: (rowIndex: number, field: string, value: string) => void
  onDeleteRow?: (index: number) => void
  getFilteredOptions?: (row: any, currentIndex: number) => string[]
  deletePassword?: string
  storedPassword?: string | null
}

export default function UnifiedScoreTable({
  filteredRows,
  selectedPlayerFilter,
  partnerNumbers,
  isOpenMode,
  readonly = false,
  onUpdateCell,
  onDeleteRow,
  getFilteredOptions,
  deletePassword,
  storedPassword
}: UnifiedScoreTableProps) {
  return (
    <>
      {/* 桌面版表格 */}
      <div className="hidden md:block">
        <div className="overflow-auto max-h-[70vh] relative">
          <table className="w-full border text-sm mb-6">
            <thead>
              <tr>
                <th className="border p-1 sticky top-0 left-0 bg-white z-20">#</th>
                <th className="border p-1 sticky top-0 bg-white z-10">A1</th>
                <th className="border p-1 sticky top-0 bg-white z-10">A2</th>
                <th className="border p-1 sticky top-0 bg-white z-10">B1</th>
                <th className="border p-1 sticky top-0 bg-white z-10">B2</th>
                <th className="border p-1 text-center w-12 sticky top-0 bg-white z-10">S/D</th>
                <th className="border p-1 text-center w-20 sticky top-0 bg-white z-10">A Score</th>
                <th className="border p-1 text-center w-20 sticky top-0 bg-white z-10">B Score</th>
                <th className="border p-1 text-center w-32 sticky top-0 bg-white z-10">time</th>
                {!readonly && <th className="border p-1 sticky top-0 bg-white z-10">Lock</th>}
                {!readonly && <th className="border p-1 sticky top-0 bg-white z-10">Delete</th>}
                {isOpenMode && <th className="border p-1 sticky top-0 bg-white z-10">WD</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="border p-1 text-center font-medium sticky left-0 bg-white z-10">{row.serial_number}</td>
                  {row.values.map((val: string, i: number) => (
                    <td key={i} className={`border p-1 ${val === selectedPlayerFilter && selectedPlayerFilter ? 'bg-yellow-100' : ''}`}>
                      {readonly ? (
                        <div className="px-1">
                          {partnerNumbers[val] ? `(${partnerNumbers[val]}) ` : ''}{val || '--'}
                        </div>
                      ) : (
                        <select
                          value={val}
                          disabled={row.lock === 'Locked'}
                          onChange={(e) => onUpdateCell?.(rowIndex, ['D', 'E', 'F', 'G'][i], e.target.value)}
                        >
                          <option value="">--</option>
                          {getFilteredOptions?.(row, i).map((opt, idx) => (
                            <option key={idx} value={opt}>
                              {partnerNumbers[opt] ? `(${partnerNumbers[opt]}) ` : ''}{opt.trim()}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  ))}
                  <td className="border p-1 text-center">{row.sd}</td>
                  <td className="border p-1 text-center">
                    {readonly ? (
                      row.h || '--'
                    ) : (
                      <input
                        type="number"
                        value={row.h}
                        onChange={(e) => onUpdateCell?.(rowIndex, 'h', e.target.value)}
                        disabled={row.lock === 'Locked'}
                        className="w-full border px-1 text-center"
                      />
                    )}
                  </td>
                  <td className="border p-1 text-center">
                    {readonly ? (
                      row.i || '--'
                    ) : (
                      <input
                        type="number"
                        value={row.i}
                        onChange={(e) => onUpdateCell?.(rowIndex, 'i', e.target.value)}
                        disabled={row.lock === 'Locked'}
                        className="w-full border px-1 text-center"
                      />
                    )}
                  </td>
                  <td className="border p-1 text-center text-xs text-gray-600">
                    {formatDateTime(row.updated_time)}
                  </td>
                  {!readonly && (
                    <td className="border p-1 text-center">
                      <button
                        onClick={() => {
                          if (row.lock === 'Locked') {
                            if (deletePassword === storedPassword) {
                              onUpdateCell?.(rowIndex, 'lock', 'Unlocked')
                            }
                          } else {
                            onUpdateCell?.(rowIndex, 'lock', 'Locked')
                          }
                        }}
                        className={`px-2 py-1 rounded text-white ${
                          row.lock === 'Locked'
                            ? deletePassword === storedPassword
                              ? 'bg-red-500 hover:bg-red-600'
                              : 'bg-gray-300 cursor-not-allowed'
                            : 'bg-green-400 hover:bg-green-500'
                        }`}
                        disabled={row.lock === 'Locked' && deletePassword !== storedPassword}
                      >
                        {row.lock === 'Locked' ? <FaLock size={16} /> : <FaLockOpen size={16} />}
                      </button>
                    </td>
                  )}
                  {!readonly && (
                    <td className="border p-1 text-center">
                      <button
                        onClick={() => onDeleteRow?.(rowIndex)}
                        disabled={row.lock === 'Locked'}
                        className={`px-2 py-1 rounded text-white ${row.lock === 'Locked' ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                  {isOpenMode && (
                    <td className="border p-1 text-center">
                      {readonly ? (
                        row.check ? '✓' : ''
                      ) : (
                        <input
                          type="checkbox"
                          checked={row.check}
                          onChange={(e) => onUpdateCell?.(rowIndex, 'check', e.target.checked.toString())}
                          disabled={row.lock === 'Locked'}
                          className="w-4 h-4"
                        />
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 手機版卡片 */}
      <div className="md:hidden space-y-3 mb-6">
        {filteredRows.map((row, rowIndex) => (
          <div key={rowIndex} className={`bg-white border rounded-lg shadow-sm p-4 ${
            row.values.some((val: string) => val === selectedPlayerFilter && selectedPlayerFilter) ? 'ring-2 ring-yellow-300' : ''
          }`}>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-800">#{row.serial_number}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  row.sd === 'S' ? 'bg-blue-100 text-blue-800' : 
                  row.sd === 'D' ? 'bg-green-100 text-green-800' : 
                  'bg-gray-100 text-gray-600'
                }`}>
                  {row.sd || '--'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDateTime(row.updated_time)}
                </span>
                {row.check && isOpenMode && (
                  <span className="text-xs font-medium text-red-600">棄賽(WD)</span>
                )}
              </div>
              {!readonly && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (row.lock === 'Locked') {
                        if (deletePassword === storedPassword) {
                          onUpdateCell?.(rowIndex, 'lock', 'Unlocked')
                        }
                      } else {
                        onUpdateCell?.(rowIndex, 'lock', 'Locked')
                      }
                    }}
                    className={`p-2 rounded text-white ${
                      row.lock === 'Locked'
                        ? deletePassword === storedPassword
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-gray-300 cursor-not-allowed'
                        : 'bg-green-400 hover:bg-green-500'
                    }`}
                    disabled={row.lock === 'Locked' && deletePassword !== storedPassword}
                  >
                    {row.lock === 'Locked' ? <FaLock size={14} /> : <FaLockOpen size={14} />}
                  </button>
                  <button
                    onClick={() => onDeleteRow?.(rowIndex)}
                    disabled={row.lock === 'Locked'}
                    className={`p-2 rounded text-white ${row.lock === 'Locked' ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Team A */}
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  {[0, 1].map(i => (
                    <div key={i} className={`border rounded px-3 py-2 text-sm ${readonly ? 'bg-gray-50' : ''} ${
                      row.values[i] === selectedPlayerFilter && selectedPlayerFilter ? 'bg-yellow-100' : ''
                    }`}>
                      {readonly ? (
                        `${partnerNumbers[row.values[i]] ? `(${partnerNumbers[row.values[i]]}) ` : ''}${row.values[i] || '--'}`
                      ) : (
                        <select
                          value={row.values[i]}
                          disabled={row.lock === 'Locked'}
                          onChange={(e) => onUpdateCell?.(rowIndex, ['D', 'E'][i], e.target.value)}
                          className="w-full bg-transparent"
                        >
                          <option value="">--</option>
                          {getFilteredOptions?.(row, i).map((opt, idx) => (
                            <option key={idx} value={opt}>
                              {partnerNumbers[opt] ? `(${partnerNumbers[opt]}) ` : ''}{opt.trim()}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
                <div className="w-20">
                  {readonly ? (
                    <div className="w-full border rounded px-3 py-2 text-center text-lg font-semibold bg-gray-50">
                      {row.h || '--'}
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={row.h}
                      onChange={(e) => onUpdateCell?.(rowIndex, 'h', e.target.value)}
                      disabled={row.lock === 'Locked'}
                      className="w-full border rounded px-3 py-2 text-center text-lg font-semibold"
                      placeholder="0"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-300 my-4"></div>

            {/* Team B */}
            <div>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-2">
                  {[2, 3].map(i => (
                    <div key={i} className={`border rounded px-3 py-2 text-sm ${readonly ? 'bg-gray-50' : ''} ${
                      row.values[i] === selectedPlayerFilter && selectedPlayerFilter ? 'bg-yellow-100' : ''
                    }`}>
                      {readonly ? (
                        `${partnerNumbers[row.values[i]] ? `(${partnerNumbers[row.values[i]]}) ` : ''}${row.values[i] || '--'}`
                      ) : (
                        <select
                          value={row.values[i]}
                          disabled={row.lock === 'Locked'}
                          onChange={(e) => onUpdateCell?.(rowIndex, ['F', 'G'][i-2], e.target.value)}
                          className="w-full bg-transparent"
                        >
                          <option value="">--</option>
                          {getFilteredOptions?.(row, i).map((opt, idx) => (
                            <option key={idx} value={opt}>
                              {partnerNumbers[opt] ? `(${partnerNumbers[opt]}) ` : ''}{opt.trim()}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
                <div className="w-20">
                  {readonly ? (
                    <div className="w-full border rounded px-3 py-2 text-center text-lg font-semibold bg-gray-50">
                      {row.i || '--'}
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={row.i}
                      onChange={(e) => onUpdateCell?.(rowIndex, 'i', e.target.value)}
                      disabled={row.lock === 'Locked'}
                      className="w-full border rounded px-3 py-2 text-center text-lg font-semibold"
                      placeholder="0"
                    />
                  )}
                </div>
              </div>
            </div>
            
            {!readonly && isOpenMode && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={row.check}
                    onChange={(e) => onUpdateCell?.(rowIndex, 'check', e.target.checked.toString())}
                    disabled={row.lock === 'Locked'}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-gray-600">棄賽(WD)</label>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}