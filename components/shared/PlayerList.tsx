'use client'

import { player_info } from '@/types'
import { FiEdit as Pencil, FiTrash2 as Trash2 } from 'react-icons/fi'

interface PlayerListProps {
  userList: player_info[]
  partnerNumbers: {[key: string]: number | null}
  lockedNames: Set<string>
  loadingLockedNames: boolean
  selectedPlayers: Set<number>
  readonly?: boolean
  onEdit?: (index: number) => void
  onDelete?: (index: number) => void
  onToggleSelection?: (index: number) => void
}

export default function PlayerList({
  userList,
  partnerNumbers,
  lockedNames,
  loadingLockedNames,
  selectedPlayers,
  readonly = false,
  onEdit,
  onDelete,
  onToggleSelection
}: PlayerListProps) {
  if (loadingLockedNames) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const partneredGroups: { [key: number]: any[] } = {}
  const singlePlayers: any[] = []
  const processedIndices = new Set()
  
  userList.forEach((user, idx) => {
    if (processedIndices.has(idx)) return
    
    const partnerNum = partnerNumbers[user.name]
    if (partnerNum) {
      if (!partneredGroups[partnerNum]) partneredGroups[partnerNum] = []
      partneredGroups[partnerNum].push({ ...user, idx })
    } else {
      singlePlayers.push({ ...user, idx })
    }
  })
  
  const renderItems: React.ReactElement[] = []
  
  Object.entries(partneredGroups)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([partnerNum, players]) => {
    if (players.length === 2) {
      const sortedPlayers = players.sort((a, b) => a.name.localeCompare(b.name))
      const [player1, player2] = sortedPlayers
      const isSelected = selectedPlayers.has(player1.idx) || selectedPlayers.has(player2.idx)
      const isLocked = lockedNames.has(player1.name) || lockedNames.has(player2.name)
      const canSelect = !readonly && !isLocked && onToggleSelection
      
      renderItems.push(
        <li 
          key={`team-${partnerNum}`}
          className={`relative rounded-lg shadow transition ${
            isSelected ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white'
          }`}
        >
          <div className="absolute top-2 left-2 z-10">
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium border border-green-200">
              Team {partnerNum}
            </span>
          </div>
          
          <div 
            className={`flex justify-between items-center p-4 pt-8 border-b border-gray-100 ${
              canSelect ? 'cursor-pointer hover:bg-gray-50' : ''
            }`}
            onClick={() => canSelect && onToggleSelection(player1.idx)}
          >
            <div className="text-base font-medium text-gray-800">
              {player1.name} <span className="text-sm text-gray-500">({player1.dupr_id})</span>
            </div>
            {!readonly && (
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(player1.idx)
                  }}
                  disabled={isLocked}
                  className="text-blue-500 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <Pencil size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.(player1.idx)
                  }}
                  disabled={isLocked}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>
          
          <div 
            className={`flex justify-between items-center p-4 ${
              canSelect ? 'cursor-pointer hover:bg-gray-50' : ''
            }`}
            onClick={() => canSelect && onToggleSelection(player2.idx)}
          >
            <div className="text-base font-medium text-gray-800">
              {player2.name} <span className="text-sm text-gray-500">({player2.dupr_id})</span>
            </div>
            {!readonly && (
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit?.(player2.idx)
                  }}
                  disabled={isLocked}
                  className="text-blue-500 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <Pencil size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete?.(player2.idx)
                  }}
                  disabled={isLocked}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>
        </li>
      )
      
      processedIndices.add(player1.idx)
      processedIndices.add(player2.idx)
    }
  })
  
  singlePlayers
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((user) => {
    const isSelected = selectedPlayers.has(user.idx)
    const isLocked = lockedNames.has(user.name)
    const canSelect = !readonly && !isLocked && onToggleSelection && (() => {
      if (selectedPlayers.size === 0) return true
      if (isSelected) return true
      if (selectedPlayers.size >= 2) return false
      return true
    })()
    
    renderItems.push(
      <li 
        key={user.idx}
        className={`flex justify-between items-center rounded-lg shadow p-4 transition ${
          isSelected ? 'bg-blue-100 border-2 border-blue-500' : 'bg-white'
        } ${
          canSelect ? 'cursor-pointer hover:bg-gray-50' : ''
        }`}
        onClick={() => canSelect && onToggleSelection(user.idx)}
      >
        <div className="text-base font-medium text-gray-800">
          {user.name} <span className="text-sm text-gray-500">({user.dupr_id})</span>
        </div>
        {!readonly && (
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.(user.idx)
              }}
              disabled={isLocked}
              className="text-blue-500 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <Pencil size={20} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.(user.idx)
              }}
              disabled={isLocked}
              className="text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <Trash2 size={20} />
            </button>
          </div>
        )}
      </li>
    )
  })

  return (
    <ul className="space-y-4">
      {renderItems}
    </ul>
  )
}