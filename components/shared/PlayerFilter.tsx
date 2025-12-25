import { getPlayersInTable } from '@/lib/constants'

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
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-3">
        <label className="text-sm font-medium text-gray-700">篩選選手(Filter)：</label>
        <select 
          value={selectedPlayerFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="border rounded px-3 py-2 min-w-[100px] text-sm"
        >
          <option value="">--</option>
          {getPlayersInTable(rows, partnerNumbers).map(playerName => (
            <option key={playerName} value={playerName}>
              {partnerNumbers[playerName] ? `(${partnerNumbers[playerName]}) ` : ''}{playerName}
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