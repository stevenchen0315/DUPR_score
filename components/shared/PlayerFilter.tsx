import { getPlayersInTable, getCourtsInTable } from '@/lib/constants'
import { FaFilter } from 'react-icons/fa'

interface PlayerFilterProps {
  selectedPlayerFilter: string
  onFilterChange: (value: string) => void
  rows: any[]
  partnerNumbers: {[key: string]: number | null}
  filteredRowsLength?: number
}

export default function PlayerFilter({ 
  selectedPlayerFilter, 
  onFilterChange, 
  rows, 
  partnerNumbers, 
  filteredRowsLength 
}: PlayerFilterProps) {
  const players = getPlayersInTable(rows, partnerNumbers)
  const courts = getCourtsInTable(rows)
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-3">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
          <FaFilter size={14} />
          篩選(Filter)：
        </label>
        <select 
          value={selectedPlayerFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="border rounded px-3 py-2 min-w-[100px] text-sm"
        >
          <option value="">--</option>
          {players.map(playerName => (
            <option key={playerName} value={playerName}>
              {partnerNumbers[playerName] ? `(${partnerNumbers[playerName]}) ` : ''}{playerName}
            </option>
          ))}
          {courts.map(court => (
            <option key={`court-${court}`} value={`Court ${court}`} className="bg-purple-100 text-purple-800">
              Court {court}
            </option>
          ))}
        </select>
        {selectedPlayerFilter && (
          <button
            onClick={() => onFilterChange('')}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            清除(Clear)
          </button>
        )}
      </div>
      
      {selectedPlayerFilter && filteredRowsLength !== undefined && (
        <div className="text-sm text-gray-600 -mt-2">
          {filteredRowsLength} matches
        </div>
      )}
    </div>
  )
}